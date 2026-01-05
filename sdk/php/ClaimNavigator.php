<?php
/**
 * Claim Navigator PHP SDK
 * Enterprise client library for Claim Navigator API
 * 
 * Usage:
 *   $client = new ClaimNavigator(['apiKey' => 'your-key', 'baseUrl' => 'https://...']);
 *   $result = $client->createFNOL([...]);
 */

class ClaimNavigator {
    private $apiKey;
    private $baseUrl;
    private $timeout;
    
    public function __construct(array $options = []) {
        $this->apiKey = $options['apiKey'] ?? '';
        $this->baseUrl = rtrim($options['baseUrl'] ?? 'https://your-site.netlify.app/.netlify/functions/api', '/');
        $this->timeout = $options['timeout'] ?? 30;
    }
    
    /**
     * Make API request
     * @private
     */
    private function request(string $endpoint, string $method = 'GET', ?array $body = null): array {
        $url = $this->baseUrl . '/' . $endpoint;
        
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($body) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if ($body) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        
        if ($error) {
            throw new Exception('Request failed: ' . $error);
        }
        
        if ($httpCode >= 400) {
            throw new Exception('HTTP error: ' . $httpCode);
        }
        
        $data = json_decode($response, true);
        
        if (!isset($data['success']) || !$data['success']) {
            $errorMsg = $data['error']['message'] ?? 'API request failed';
            throw new Exception($errorMsg);
        }
        
        return $data['data'] ?? [];
    }
    
    /**
     * Create FNOL submission
     */
    public function createFNOL(array $fnolData): array {
        return $this->request('fnol/create', 'POST', $fnolData);
    }
    
    /**
     * Check deadlines
     */
    public function checkDeadlines(string $state, ?string $carrier = null, ?string $claimType = null, ?string $dateOfLoss = null): array {
        $params = ['state' => $state];
        if ($carrier) $params['carrier'] = $carrier;
        if ($claimType) $params['claimType'] = $claimType;
        if ($dateOfLoss) $params['dateOfLoss'] = $dateOfLoss;
        
        return $this->request('deadlines/check', 'POST', $params);
    }
    
    /**
     * Analyze compliance
     */
    public function analyzeCompliance(string $state, string $carrier, string $claimType, ?array $events = null): array {
        $params = [
            'state' => $state,
            'carrier' => $carrier,
            'claimType' => $claimType,
            'events' => $events ?? []
        ];
        return $this->request('compliance/analyze', 'POST', $params);
    }
    
    /**
     * Upload evidence
     */
    public function uploadEvidence(string $fileUrl, string $fileName, ?int $fileSize = null, ?string $mimeType = null, ?string $category = null): array {
        $params = [
            'file_url' => $fileUrl,
            'file_name' => $fileName
        ];
        if ($fileSize !== null) $params['file_size'] = $fileSize;
        if ($mimeType) $params['mime_type'] = $mimeType;
        if ($category) $params['category'] = $category;
        
        return $this->request('evidence/upload', 'POST', $params);
    }
    
    /**
     * Interpret contractor estimate
     */
    public function interpretEstimate(string $fileUrl, ?string $lossType = null, ?string $severity = null, ?array $areas = null): array {
        $params = ['file_url' => $fileUrl];
        if ($lossType) $params['loss_type'] = $lossType;
        if ($severity) $params['severity'] = $severity;
        if ($areas) $params['areas'] = $areas;
        
        return $this->request('estimate/interpret', 'POST', $params);
    }
    
    /**
     * Calculate settlement
     */
    public function calculateSettlement(float $initialOffer, ?float $estimatedDamage = null, ?float $policyLimits = null, ?float $deductible = null): array {
        $params = ['initial_offer' => $initialOffer];
        if ($estimatedDamage !== null) $params['estimated_damage'] = $estimatedDamage;
        if ($policyLimits !== null) $params['policy_limits'] = $policyLimits;
        if ($deductible !== null) $params['deductible'] = $deductible;
        
        return $this->request('settlement/calc', 'POST', $params);
    }
    
    /**
     * Compare policies
     */
    public function comparePolicies(string $policyAUrl, string $policyBUrl): array {
        return $this->request('policy/compare', 'POST', [
            'policy_a_url' => $policyAUrl,
            'policy_b_url' => $policyBUrl
        ]);
    }
    
    /**
     * List alerts
     */
    public function listAlerts(?bool $resolved = null, int $limit = 50, int $offset = 0): array {
        $params = ['limit' => $limit, 'offset' => $offset];
        if ($resolved !== null) $params['resolved'] = $resolved;
        
        $queryString = http_build_query($params);
        return $this->request('alerts/list?' . $queryString, 'GET');
    }
    
    /**
     * Resolve alert
     */
    public function resolveAlert(string $alertId): array {
        return $this->request('alerts/resolve', 'POST', ['alert_id' => $alertId]);
    }
    
    /**
     * Query settlement history
     */
    public function queryHistory(?string $carrier = null, ?string $state = null, ?string $claimType = null, int $limit = 50): array {
        $params = ['limit' => $limit];
        if ($carrier) $params['carrier'] = $carrier;
        if ($state) $params['state'] = $state;
        if ($claimType) $params['claim_type'] = $claimType;
        
        $queryString = http_build_query($params);
        return $this->request('history/query?' . $queryString, 'GET');
    }
    
    /**
     * Find expert witnesses
     */
    public function findExpert(?string $specialty = null, ?string $state = null, ?int $minExperience = null, ?string $nameSearch = null): array {
        $params = [];
        if ($specialty) $params['specialty'] = $specialty;
        if ($state) $params['state'] = $state;
        if ($minExperience !== null) $params['min_experience'] = $minExperience;
        if ($nameSearch) $params['name_search'] = $nameSearch;
        
        $queryString = $params ? '?' . http_build_query($params) : '';
        return $this->request('expert/find' . $queryString, 'GET');
    }
    
    /**
     * Generate checklist
     */
    public function generateChecklist(?string $claimId = null): array {
        $params = [];
        if ($claimId) $params['claim_id'] = $claimId;
        
        return $this->request('checklist/generate', 'POST', $params);
    }
}


