import React from 'react';
import { 
  XMarkIcon, 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  LinkIcon,
  BoltIcon,
  BuildingOffice2Icon,
  FireIcon,
  HeartIcon,
  TruckIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';

const RiskAnalysisModal = ({ isOpen, onClose, analysis, isLoading, alert }) => {
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Risk Analysis: {alert?.event}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600">Analyzing risks, please wait...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Alert Summary */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <ShieldCheckIcon className="h-6 w-6 mr-2 text-blue-600" />
                  Alert Summary
                </h3>
                <p className="text-sm mt-1 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600">{analysis.alert_summary}</p>
              </div>

              {/* Real-Time Impacts */}
              {analysis.real_time_impacts && analysis.real_time_impacts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <BoltIcon className="h-6 w-6 mr-2 text-orange-600" />
                    Real-Time Impacts
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {analysis.real_time_impacts.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-600 mr-2">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Infrastructure Damage */}
              {analysis.infrastructure_damage && analysis.infrastructure_damage.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <BuildingOffice2Icon className="h-6 w-6 mr-2 text-red-600" />
                    Infrastructure Damage
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {analysis.infrastructure_damage.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Hazards and Dangers */}
              {analysis.hazards_and_dangers && analysis.hazards_and_dangers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <FireIcon className="h-6 w-6 mr-2 text-yellow-600" />
                    Hazards & Dangers
                  </h3>
                  <ul className="space-y-2 text-gray-700 bg-yellow-50 p-3 rounded-lg">
                    {analysis.hazards_and_dangers.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-600 mr-2">⚠️</span>
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Injuries and Casualties */}
              {analysis.injuries_and_casualties && analysis.injuries_and_casualties.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <HeartIcon className="h-6 w-6 mr-2 text-pink-600" />
                    Injuries & Casualties
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {analysis.injuries_and_casualties.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-pink-600 mr-2">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Safety Recommendations */}
              {analysis.safety_recommendations && analysis.safety_recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <InformationCircleIcon className="h-6 w-6 mr-2 text-green-600" />
                    Safety Recommendations
                  </h3>
                  <ul className="space-y-2 text-gray-700 bg-green-50 p-3 rounded-lg">
                    {analysis.safety_recommendations.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-sm font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emergency Response */}
              {analysis.emergency_response && analysis.emergency_response.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <TruckIcon className="h-6 w-6 mr-2 text-purple-600" />
                    Emergency Response
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    {analysis.emergency_response.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Affected Areas */}
              {analysis.affected_areas && analysis.affected_areas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <MapPinIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Affected Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.affected_areas.map((area, index) => (
                      <span key={index} className="inline-block bg-indigo-100 text-indigo-800 text-xs px-3 py-1 rounded-full">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Supporting Links */}
              {analysis.supporting_links && analysis.supporting_links.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <LinkIcon className="h-6 w-6 mr-2 text-gray-500" />
                    Official Sources & News
                  </h3>
                  <div className="space-y-2">
                    {analysis.supporting_links.map((link, index) => (
                      <a 
                        key={index} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="block text-blue-600 hover:text-blue-800 hover:underline text-sm break-all"
                      >
                        🔗 {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback for old format (potential_impacts) */}
              {analysis.potential_impacts && !analysis.real_time_impacts && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-yellow-600" />
                    Potential Impacts
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    {analysis.potential_impacts.map((item, index) => (
                      <p key={index}><ReactMarkdown>{item}</ReactMarkdown></p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-10">
              <p>No analysis data available. Please try again.</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 text-right">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisModal;
