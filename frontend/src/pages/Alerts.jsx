import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FunnelIcon } from '@heroicons/react/24/outline';
import LocationMap from '../components/LocationMap';
import api from '../services/api';

const Alerts = () => {
  const [agentResponse, setAgentResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [location] = useState('California');
  const [mapData, setMapData] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  
  // Helper function to get severity emoji
  const getSeverityEmoji = (severity) => {
    const severityLower = severity?.toLowerCase() || '';
    if (severityLower.includes('severe') || severityLower.includes('extreme')) return '🔴';
    if (severityLower.includes('moderate')) return '🟡';
    if (severityLower.includes('minor')) return '🟢';
    return '⚠️';
  };

  useEffect(() => {
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    setAgentResponse('');
    setShowMap(false);
    setMapData(null);
    try {
      const response = await api.getAlerts(location);
      if (response && response.alerts) {
        setAgentResponse(response);
      } else {
        // Handle cases where response is not in the expected format
        setAgentResponse({ alerts: [], insights: 'Could not retrieve structured alert data.' });
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAgentResponse({ alerts: [], insights: 'Failed to load alerts. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShowMap = async () => {
    if (!agentResponse || !agentResponse.alerts) return;

    setMapLoading(true);
    setShowMap(true);
    try {
      const allZones = agentResponse.alerts.flatMap(alert => alert.affected_zones);
      const uniqueZones = [...new Set(allZones)];
      
      const mapApiResponse = await api.getMapForZones(uniqueZones);
      
      // Check for error response
      if (mapApiResponse && mapApiResponse.map_data && mapApiResponse.map_data.error) {
        console.log('[Alerts] Map API returned error:', mapApiResponse.map_data.error);
        // Show user-friendly error message using window.alert to avoid naming conflicts
        window.alert(`Unable to generate map: ${mapApiResponse.map_data.error}`);
        setMapData(null);
      } else if (mapApiResponse && mapApiResponse.map_data) {
        setMapData(mapApiResponse.map_data);
      }
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setMapLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Active Weather Alerts</h2>
            <p className="text-sm text-gray-500 mt-1">Real-time weather warnings and advisories for {location}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Map */}
        {showMap && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📍 Alert Zones</h3>
            {mapLoading ? (
              <div className="flex justify-center items-center h-[450px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : mapData ? (
              <LocationMap 
                markers={mapData.markers}
                center={mapData.center}
                zoom={mapData.zoom}
                height="450px" 
              />
            ) : (
              <div className="text-center py-8 text-gray-500 h-[450px]">
                <p>Could not load map data.</p>
              </div>
            )}
          </div>
        )}

        {/* Alert Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : agentResponse && agentResponse.alerts ? (
            <div className="space-y-4">
              {!showMap && agentResponse.alerts.length > 0 && (
                <button 
                  onClick={handleShowMap}
                  className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 mb-4"
                >
                  Show on Map
                </button>
              )}
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mb-3" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-4" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-md font-semibold text-gray-700 mb-2 mt-3" {...props} />,
                  p: ({node, ...props}) => <p className="text-gray-700 mb-3 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-4 ml-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                  hr: ({node, ...props}) => <hr className="my-6 border-gray-300" {...props} />,
                }}
              >
                {`# 🚨 Active Weather Alerts for ${location}\n\n` +
                  `Found **${agentResponse.alerts.length}** active alert${agentResponse.alerts.length !== 1 ? 's' : ''}.\n\n` +
                  `**Insights:** ${agentResponse.insights}`
                }
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active alerts in your area</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
