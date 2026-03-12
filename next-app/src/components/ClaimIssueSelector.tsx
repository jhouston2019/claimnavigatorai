'use client'

import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface ClaimIssue {
  id: string
  label: string
  description: string
}

const CLAIM_ISSUES: ClaimIssue[] = [
  { id: 'missing_scope', label: 'Missing Scope Items', description: 'Items excluded from estimate' },
  { id: 'low_labor_rates', label: 'Low Labor Rates', description: 'Below-market pricing' },
  { id: 'wear_and_tear', label: 'Wear and Tear Denial', description: 'Aging vs storm damage' },
  { id: 'pre_existing', label: 'Pre-Existing Damage', description: 'Prior condition claim' },
  { id: 'maintenance', label: 'Maintenance Exclusion', description: 'Lack of upkeep' },
  { id: 'not_storm_related', label: 'Not Storm Related', description: 'Event causation denial' },
  { id: 'depreciation', label: 'Excessive Depreciation', description: 'Reduced payout' },
  { id: 'underestimated_quantities', label: 'Underestimated Quantities', description: 'Reduced square footage' },
  { id: 'delayed_claim', label: 'Claim Delays', description: 'Taking too long' },
  { id: 'low_settlement', label: 'Low Settlement Offer', description: 'Below repair cost' },
]

interface ClaimIssueSelectorProps {
  onSelect?: (selectedIssues: string[]) => void
  selectedIssues?: string[]
}

export default function ClaimIssueSelector({ onSelect, selectedIssues = [] }: ClaimIssueSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedIssues)
  const [isOpen, setIsOpen] = useState(false)

  const toggleIssue = (issueId: string) => {
    const newSelected = selected.includes(issueId)
      ? selected.filter(id => id !== issueId)
      : [...selected, issueId]
    
    setSelected(newSelected)
    if (onSelect) {
      onSelect(newSelected)
    }
  }

  const selectedLabels = selected
    .map(id => CLAIM_ISSUES.find(issue => issue.id === id)?.label)
    .filter(Boolean)
    .join(', ')

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        What issues are you experiencing? (Select all that apply)
      </label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-primary-400 transition-colors"
      >
        <span className="text-gray-700">
          {selected.length === 0 
            ? 'Select claim issues...' 
            : `${selected.length} issue${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Items Preview */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map(id => {
            const issue = CLAIM_ISSUES.find(i => i.id === id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
              >
                {issue?.label}
                <button
                  type="button"
                  onClick={() => toggleIssue(id)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {CLAIM_ISSUES.map(issue => {
            const isSelected = selected.includes(issue.id)
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => toggleIssue(issue.id)}
                className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  isSelected ? 'bg-primary-50' : ''
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected 
                    ? 'bg-primary-600 border-primary-600' 
                    : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900">{issue.label}</p>
                  <p className="text-xs text-gray-600">{issue.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
