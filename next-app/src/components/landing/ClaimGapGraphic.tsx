'use client'

interface ClaimGapGraphicProps {
  carrierEstimate?: number
  trueRepairScope?: number
  missingScope?: number
  pricingSuppression?: number
  excludedCoverage?: number
}

export default function ClaimGapGraphic({
  carrierEstimate = 18200,
  trueRepairScope = 36750,
  missingScope = 9400,
  pricingSuppression = 6100,
  excludedCoverage = 3050,
}: ClaimGapGraphicProps) {
  const totalGap = missingScope + pricingSuppression + excludedCoverage
  const carrierHeight = 100
  const scopeHeight = (trueRepairScope / carrierEstimate) * carrierHeight

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-sm border border-white/20 p-8 max-w-2xl mx-auto mt-12">
      {/* Bar Comparison */}
      <div className="flex items-end justify-center gap-12 mb-8">
        {/* Left Bar - Carrier Estimate */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center">
            <div 
              className="w-full bg-gray-400 border-2 border-gray-300 relative"
              style={{ height: `${carrierHeight}px` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">
                  ${carrierEstimate.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-white font-semibold text-sm uppercase tracking-wide">
                Carrier's Estimate
              </p>
            </div>
          </div>
        </div>

        {/* Right Bar - True Repair Scope */}
        <div className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center">
            <div 
              className="w-full bg-red-600 border-2 border-red-500 relative"
              style={{ height: `${scopeHeight}px` }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  ${trueRepairScope.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-white font-semibold text-sm uppercase tracking-wide">
                Verified Repair Scope
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gap Breakdown */}
      <div className="border-t border-white/30 pt-6 mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-white">
            <span className="text-sm">Missing scope:</span>
            <span className="font-semibold">${missingScope.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm">Pricing suppression:</span>
            <span className="font-semibold">${pricingSuppression.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-white">
            <span className="text-sm">Excluded coverage:</span>
            <span className="font-semibold">${excludedCoverage.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Total Gap */}
      <div className="border-t-2 border-red-600 pt-4">
        <div className="flex justify-between items-center">
          <span className="text-white font-bold text-lg">
            Potential Missing Claim Value:
          </span>
          <span className="text-red-500 font-bold text-2xl">
            ${totalGap.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
