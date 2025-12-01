/**
 * Storage v2 Manager
 * Mega Build B - Safe LocalStorage with versioning, backups, and self-healing
 */

(function() {
  const STORAGE_KEY = "cn_storage_v2";
  const BACKUPS_KEY = "cn_storage_backups";
  const SNAPSHOTS_KEY = "cn_snapshots";
  const MAX_BACKUPS = 10;
  const SCHEMA_VERSION = 2;

  // Default data structure
  function getDefaultData() {
    return {
      schemaVersion: SCHEMA_VERSION,
      timestamp: Date.now(),
      profile: {},
      evidence: { list: [], count: 0 },
      documents: { list: [], count: 0 },
      timeline: [],
      health: { lastScore: null },
      roadmap: { stagesCompleted: [], currentStage: 1 }
    };
  }

  // Load data with corruption detection
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        console.log("CNStorage: No data found, initializing default");
        const defaultData = getDefaultData();
        save(defaultData);
        return defaultData;
      }

      const data = JSON.parse(raw);
      
      // Validate schema version
      if (!data.schemaVersion || data.schemaVersion < SCHEMA_VERSION) {
        console.warn("CNStorage: Schema version mismatch, upgrading...");
        data = upgradeSchema(data);
      }

      // Validate structure
      if (!validateStructure(data)) {
        console.warn("CNStorage: Structure invalid, attempting repair...");
        data = repairStructure(data);
      }

      return data;
    } catch (error) {
      console.error("CNError (Storage Load):", error);
      
      // Attempt restore from backup
      const restored = restoreFromBackup();
      if (restored) {
        if (window.CNToast) {
          window.CNToast.warn("Claim data restored from backup.");
        }
        return restored;
      }

      // Last resort: return default
      if (window.CNToast) {
        window.CNToast.error("Storage corrupted. Starting fresh.");
      }
      const defaultData = getDefaultData();
      save(defaultData);
      return defaultData;
    }
  }

  // Save data with auto-backup
  function save(data) {
    try {
      // Update timestamp
      data.timestamp = Date.now();
      data.schemaVersion = SCHEMA_VERSION;

      // Create auto-backup before save
      backup("auto");

      // Save main data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("CNError (Storage Save):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to save data. Check storage space.");
      }
      return false;
    }
  }

  // Get section
  function getSection(sectionName) {
    const data = load();
    return data[sectionName] || null;
  }

  // Set section
  function setSection(sectionName, value) {
    const data = load();
    data[sectionName] = value;
    return save(data);
  }

  // Create backup
  function backup(reason = "manual") {
    try {
      const data = load();
      const backups = listBackups();
      
      backups.push({
        id: Date.now(),
        timestamp: Date.now(),
        reason: reason,
        data: JSON.parse(JSON.stringify(data)) // Deep clone
      });

      // Keep only last MAX_BACKUPS
      if (backups.length > MAX_BACKUPS) {
        backups.shift();
      }

      localStorage.setItem(BACKUPS_KEY, JSON.stringify(backups));
      return true;
    } catch (error) {
      console.error("CNError (Backup):", error);
      return false;
    }
  }

  // List backups
  function listBackups() {
    try {
      const raw = localStorage.getItem(BACKUPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Restore from backup
  function restoreFromBackup() {
    const backups = listBackups();
    if (backups.length === 0) return null;

    // Get most recent backup
    const latest = backups[backups.length - 1];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(latest.data));
      return latest.data;
    } catch (error) {
      console.error("CNError (Restore Backup):", error);
      return null;
    }
  }

  // Restore specific backup
  function restoreBackup(id) {
    const backups = listBackups();
    const backup = backups.find(b => b.id === id);
    if (!backup) {
      if (window.CNToast) {
        window.CNToast.error("Backup not found.");
      }
      return false;
    }

    try {
      // Create backup before restore
      backup("pre-restore");
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.data));
      
      if (window.CNToast) {
        window.CNToast.success("Backup restored successfully.");
      }
      return true;
    } catch (error) {
      console.error("CNError (Restore Backup):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to restore backup.");
      }
      return false;
    }
  }

  // Validate structure
  function validate() {
    const data = load();
    return validateStructure(data);
  }

  function validateStructure(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.schemaVersion) return false;
    if (!data.profile || typeof data.profile !== 'object') return false;
    if (!data.evidence || typeof data.evidence !== 'object') return false;
    if (!data.documents || typeof data.documents !== 'object') return false;
    if (!Array.isArray(data.timeline)) return false;
    if (!data.health || typeof data.health !== 'object') return false;
    if (!data.roadmap || typeof data.roadmap !== 'object') return false;
    return true;
  }

  // Repair structure
  function repairStructure(data) {
    const defaultData = getDefaultData();
    const repaired = { ...defaultData, ...data };
    
    // Ensure all required sections exist
    if (!repaired.profile) repaired.profile = {};
    if (!repaired.evidence) repaired.evidence = { list: [], count: 0 };
    if (!repaired.documents) repaired.documents = { list: [], count: 0 };
    if (!Array.isArray(repaired.timeline)) repaired.timeline = [];
    if (!repaired.health) repaired.health = { lastScore: null };
    if (!repaired.roadmap) repaired.roadmap = { stagesCompleted: [], currentStage: 1 };

    // Repair counts
    if (Array.isArray(repaired.evidence.list)) {
      repaired.evidence.count = repaired.evidence.list.length;
    }
    if (Array.isArray(repaired.documents.list)) {
      repaired.documents.count = repaired.documents.list.length;
    }

    save(repaired);
    return repaired;
  }

  // Upgrade schema
  function upgradeSchema(oldData) {
    console.log("CNStorage: Upgrading schema from", oldData.schemaVersion || 1, "to", SCHEMA_VERSION);
    
    let newData = getDefaultData();

    // Migrate old localStorage keys if they exist
    try {
      // Migrate claim profile
      const oldProfile = localStorage.getItem("cn_claim_profile");
      if (oldProfile) {
        newData.profile = JSON.parse(oldProfile);
      }

      // Migrate evidence
      const oldEvidenceList = localStorage.getItem("cn_evidence_list");
      const oldEvidenceCount = parseInt(localStorage.getItem("cn_evidence_photo_count") || "0", 10);
      if (oldEvidenceList) {
        newData.evidence.list = JSON.parse(oldEvidenceList);
        newData.evidence.count = oldEvidenceCount || newData.evidence.list.length;
      }

      // Migrate documents
      const oldDocList = localStorage.getItem("cn_document_list");
      const oldDocCount = parseInt(localStorage.getItem("cn_docs_generated") || "0", 10);
      if (oldDocList) {
        newData.documents.list = JSON.parse(oldDocList);
        newData.documents.count = oldDocCount || newData.documents.list.length;
      }

      // Migrate timeline
      const oldTimeline = localStorage.getItem("cn_claim_timeline");
      if (oldTimeline) {
        newData.timeline = JSON.parse(oldTimeline);
      }

      // Migrate health
      const oldHealth = localStorage.getItem("cn_claim_health_score");
      if (oldHealth) {
        const healthData = JSON.parse(oldHealth);
        newData.health.lastScore = healthData.score || null;
      }

      // Migrate roadmap
      const oldCurrentStage = localStorage.getItem("currentStageId");
      const oldCompletedStages = localStorage.getItem("completedStageIds");
      if (oldCurrentStage) {
        newData.roadmap.currentStage = parseInt(oldCurrentStage, 10) || 1;
      }
      if (oldCompletedStages) {
        newData.roadmap.stagesCompleted = JSON.parse(oldCompletedStages);
      }

      // Merge any existing data from old structure
      Object.keys(oldData).forEach(key => {
        if (!newData.hasOwnProperty(key) && key !== 'schemaVersion') {
          newData[key] = oldData[key];
        }
      });

    } catch (error) {
      console.error("CNError (Schema Upgrade):", error);
    }

    save(newData);
    return newData;
  }

  // Reindex (repair all)
  function reindex() {
    const data = load();
    const repaired = repairStructure(data);
    
    // Reindex evidence count
    if (Array.isArray(repaired.evidence.list)) {
      repaired.evidence.count = repaired.evidence.list.length;
    }

    // Reindex document count
    if (Array.isArray(repaired.documents.list)) {
      repaired.documents.count = repaired.documents.list.length;
    }

    save(repaired);
    return repaired;
  }

  // Purge all
  function purgeAll() {
    try {
      // Remove main storage
      localStorage.removeItem(STORAGE_KEY);
      
      // Remove backups
      localStorage.removeItem(BACKUPS_KEY);
      
      // Remove snapshots
      localStorage.removeItem(SNAPSHOTS_KEY);
      
      // Remove all old keys
      const keysToRemove = [
        "cn_claim_profile",
        "cn_evidence_list",
        "cn_evidence_photo_count",
        "cn_document_list",
        "cn_docs_generated",
        "cn_claim_timeline",
        "cn_claim_health_score",
        "currentStageId",
        "completedStageIds",
        "claimRoadmapProgress",
        "roadmapToolStatus"
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Remove any other cn_ keys
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (key.startsWith('cn_')) {
          localStorage.removeItem(key);
        }
      });

      if (window.CNToast) {
        window.CNToast.success("All claim data cleared.");
      }

      return true;
    } catch (error) {
      console.error("CNError (Purge All):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to clear all data.");
      }
      return false;
    }
  }

  // Export as JSON
  function exportAsJson() {
    try {
      const data = load();
      const exportData = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        schemaVersion: data.schemaVersion,
        data: data
      };

      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim-navigator-claim-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (window.CNToast) {
        window.CNToast.success("Claim data exported successfully.");
      }
      return true;
    } catch (error) {
      console.error("CNError (Export):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to export data.");
      }
      return false;
    }
  }

  // Import JSON
  function importJson(jsonData) {
    try {
      const imported = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Validate export version
      if (!imported.exportVersion || imported.exportVersion !== 1) {
        throw new Error("Invalid export format.");
      }

      // Validate schema version
      if (!imported.schemaVersion || imported.schemaVersion < SCHEMA_VERSION) {
        console.warn("CNStorage: Imported schema is older, will upgrade on save");
      }

      // Validate required sections
      if (!imported.data || !validateStructure(imported.data)) {
        throw new Error("Invalid data structure.");
      }

      // Create backup before import
      backup("pre-import");

      // Save imported data
      save(imported.data);

      if (window.CNToast) {
        window.CNToast.success("Claim data imported successfully.");
      }

      return true;
    } catch (error) {
      console.error("CNError (Import):", error);
      if (window.CNToast) {
        window.CNToast.error(`Import failed: ${error.message}`);
      }
      return false;
    }
  }

  // Snapshot functions
  function createSnapshot(label = "") {
    try {
      const data = load();
      const snapshots = listSnapshots();
      
      snapshots.push({
        id: Date.now(),
        timestamp: Date.now(),
        label: label || `Snapshot ${new Date().toLocaleString()}`,
        data: JSON.parse(JSON.stringify(data)) // Deep clone
      });

      // Keep max 20 snapshots
      if (snapshots.length > 20) {
        snapshots.shift();
      }

      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));

      if (window.CNToast) {
        window.CNToast.success("Snapshot created successfully.");
      }
      return true;
    } catch (error) {
      console.error("CNError (Create Snapshot):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to create snapshot.");
      }
      return false;
    }
  }

  function listSnapshots() {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function restoreSnapshot(id) {
    const snapshots = listSnapshots();
    const snapshot = snapshots.find(s => s.id === id);
    if (!snapshot) {
      if (window.CNToast) {
        window.CNToast.error("Snapshot not found.");
      }
      return false;
    }

    try {
      // Create backup before restore
      backup("pre-snapshot-restore");
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.data));
      
      if (window.CNToast) {
        window.CNToast.success("Snapshot restored successfully.");
      }
      return true;
    } catch (error) {
      console.error("CNError (Restore Snapshot):", error);
      if (window.CNToast) {
        window.CNToast.error("Failed to restore snapshot.");
      }
      return false;
    }
  }

  // Expose API
  window.CNStorage = {
    version: SCHEMA_VERSION,
    KEY: STORAGE_KEY,
    load,
    save,
    getSection,
    setSection,
    backup,
    listBackups,
    restoreBackup,
    validate,
    reindex,
    purgeAll,
    exportAsJson,
    importJson,
    createSnapshot,
    listSnapshots,
    restoreSnapshot
  };

  // Auto-initialize on load
  if (typeof window !== 'undefined') {
    // Load and validate on first access
    setTimeout(() => {
      const data = load();
      if (!validateStructure(data)) {
        console.warn("CNStorage: Auto-repairing structure on load");
        repairStructure(data);
      }
    }, 100);
  }
})();

