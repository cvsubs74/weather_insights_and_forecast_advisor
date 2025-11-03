import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import LocationMap from '../components/LocationMap';
import RiskAnalysisModal from '../components/RiskAnalysisModal';
import SevereWeatherCard from '../components/SevereWeatherCard';
import api from '../services/api';
import { useDemoMode } from '../contexts/DemoModeContext';
import { useTour } from '../contexts/TourContext';
import { mockDashboardData, mockRiskAnalysis } from '../data/mockData';
import { 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon, 
  MapPinIcon, 
  MapIcon,
  ChartBarIcon,
  BuildingOffice2Icon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { isDemoMode } = useDemoMode();
  const { isTourActive, currentStep, tourSteps } = useTour();
  
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('dashboardAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [agentResponse, setAgentResponse] = useState(() => {
    return localStorage.getItem('dashboardResponse') || '';
  });
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(() => {
    return localStorage.getItem('dashboardLocation') || '';
  });
  const [selectedState, setSelectedState] = useState(() => {
    const saved = localStorage.getItem('dashboardSelectedState');
    return saved || '';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(() => {
    return localStorage.getItem('dashboardSelectedRegion') || 'National';
  });
  const [severeEvents, setSevereEvents] = useState(() => {
    const saved = localStorage.getItem('dashboardSevereEvents');
    return saved ? JSON.parse(saved) : [];
  });
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const eventsPerPage = 4;

  // State for Risk Analysis Modal
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedAlertForAnalysis, setSelectedAlertForAnalysis] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(false);

  // Map State
  const [mapView, setMapView] = useState({ center: [39.8283, -98.5795], zoom: 4 });
  const [mapMarkers, setMapMarkers] = useState([]);
  const [alertPage, setAlertPage] = useState(0);
  const alertsPerPage = 4;
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [loadingMapForAlert, setLoadingMapForAlert] = useState(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (agentResponse) localStorage.setItem('dashboardResponse', agentResponse);
  }, [agentResponse]);

  useEffect(() => {
    if (location) localStorage.setItem('dashboardLocation', location);
  }, [location]);

  useEffect(() => {
    if (severeEvents.length > 0) localStorage.setItem('dashboardSevereEvents', JSON.stringify(severeEvents));
  }, [severeEvents]);

  useEffect(() => {
    if (alerts.length > 0) localStorage.setItem('dashboardAlerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('dashboardSelectedState', selectedState);
  }, [selectedState]);

  useEffect(() => {
    localStorage.setItem('dashboardSelectedRegion', selectedRegion);
  }, [selectedRegion]);

  // Load mock data when tour reaches dashboard steps
  useEffect(() => {
    if (isTourActive && isDemoMode && tourSteps[currentStep]) {
      const currentStepId = tourSteps[currentStep].id;
      
      // Load mock data when tour reaches dashboard-alerts-scroll step
      if (currentStepId === 'dashboard-alerts-scroll' || currentStepId === 'risk-analysis-button' || 
          currentStepId === 'risk-analysis-modal' || currentStepId === 'show-map-button' || 
          currentStepId === 'dashboard-map') {
        console.log('[Dashboard] Tour active - loading mock data for alerts');
        
        // Set mock alerts in the main alerts state (not severeEvents)
        setAlerts(mockDashboardData.alerts);
        setAgentResponse(mockDashboardData.insights);
        setLocation('Tampa Bay, Florida');
        setSelectedRegion('South');
        
        // Set map center but NO markers initially (until show-map-button step)
        if (mockDashboardData.map_data) {
          // Show general US map without markers initially
          if (currentStepId === 'dashboard-alerts-scroll' || currentStepId === 'risk-analysis-button' || 
              currentStepId === 'risk-analysis-modal') {
            setMapMarkers([]); // No markers yet
            setMapView({
              center: [39.8283, -98.5795], // Center of US
              zoom: 4
            });
          }
        }
      }
      
      // Auto-trigger risk analysis modal at risk-analysis-button step
      if (currentStepId === 'risk-analysis-button') {
        setTimeout(() => {
          console.log('[Dashboard] Auto-opening risk analysis modal for tour');
          setSelectedAlertForAnalysis(mockDashboardData.alerts[0]); // Hurricane Milton
          setRiskAnalysis(mockRiskAnalysis);
          setIsRiskModalOpen(true);
        }, 800); // Delay for smooth transition
      }
      
      // Keep modal open during risk-analysis-modal step
      if (currentStepId === 'risk-analysis-modal') {
        if (!isRiskModalOpen) {
          setSelectedAlertForAnalysis(mockDashboardData.alerts[0]);
          setRiskAnalysis(mockRiskAnalysis);
          setIsRiskModalOpen(true);
        }
      }
      
      // Close modal and show map markers at show-map-button step
      if (currentStepId === 'show-map-button') {
        setTimeout(() => {
          console.log('[Dashboard] Auto-closing risk modal and showing map markers');
          setIsRiskModalOpen(false);
          
          // NOW show the map markers after "clicking" show on map
          if (mockDashboardData.map_data && mockDashboardData.map_data.markers) {
            setMapMarkers(mockDashboardData.map_data.markers);
            setMapView({
              center: [mockDashboardData.map_data.center.lat, mockDashboardData.map_data.center.lng],
              zoom: mockDashboardData.map_data.zoom
            });
          }
        }, 500); // Delay for smooth transition
      }
      
      // Ensure modal is closed and markers are shown at dashboard-map step
      if (currentStepId === 'dashboard-map') {
        setIsRiskModalOpen(false);
        if (mockDashboardData.map_data && mockDashboardData.map_data.markers) {
          setMapMarkers(mockDashboardData.map_data.markers);
          setMapView({
            center: [mockDashboardData.map_data.center.lat, mockDashboardData.map_data.center.lng],
            zoom: mockDashboardData.map_data.zoom
          });
        }
      }
    }
  }, [isTourActive, currentStep, isDemoMode, tourSteps, isRiskModalOpen]);

  useEffect(() => {
    // Auto-load national alerts on mount - only run once
    const hasLoadedInitial = sessionStorage.getItem('dashboardInitialLoad');
    
    if (!hasLoadedInitial) {
      sessionStorage.setItem('dashboardInitialLoad', 'true');
      
      const savedAlerts = localStorage.getItem('dashboardAlerts');
      const savedRegion = localStorage.getItem('dashboardSelectedRegion');
      
      if (!savedAlerts || savedAlerts === '[]') {
        // Default to National search on first load
        setSelectedRegion('National');
        setLocation('National');
        loadAlerts('National');
      } else if (savedRegion === 'National') {
        // Maintain National selection if it was previously selected
        setSelectedRegion('National');
      }
      
      // Load severe weather events on mount
      const savedEvents = localStorage.getItem('dashboardSevereEvents');
      if (!savedEvents || savedEvents === '[]') {
        loadSevereWeatherEvents();
      }
    }
    
    // Listen for session expiration events
    const handleSessionExpired = () => {
      console.log('[Dashboard] Session expired, clearing state');
      // Clear all dashboard state
      setAgentResponse('');
      setLocation('');
      setSevereEvents([]);
      setAlerts([]);
      localStorage.removeItem('dashboardSevereEvents');
      localStorage.removeItem('dashboardAlerts');
      // Reload both severe weather events and national alerts
      loadSevereWeatherEvents();
      loadNationalSevereAlerts();
    };
    
    window.addEventListener('sessionExpired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAnalyzeRisk = async (alert) => {
    setSelectedAlertForAnalysis(alert);
    setIsRiskModalOpen(true);
    setIsAnalyzingRisk(true);
    setRiskAnalysis(null); // Clear previous analysis
    
    try {
      // Use mock data in demo mode
      if (isDemoMode) {
        console.log('[Dashboard] Using mock risk analysis data (demo mode)');
        // Simulate API delay for realistic demo experience
        await new Promise(resolve => setTimeout(resolve, 1500));
        setRiskAnalysis(mockRiskAnalysis);
      } else {
        // Make real API call in live mode
        const response = await api.analyzeRisk(alert);
        setRiskAnalysis(response);
      }
    } catch (error) {
      console.error('Failed to analyze risk:', error);
      setRiskAnalysis({ error: 'Failed to analyze risk. Please try again.' }); // Set an error state
    } finally {
      setIsAnalyzingRisk(false);
    }
  };

    const loadAlerts = async (currentLocation) => {
    if (loading) return;
    setLoading(true);
    setAlerts([]);
    setAgentResponse('');
    try {
      const response = await api.getAlerts(currentLocation);
      console.log('[Dashboard] loadAlerts response:', response);
      
      if (response && response.alerts && Array.isArray(response.alerts)) {
        // Remove duplicates based on event, area, severity, and headline
        const uniqueAlerts = [];
        const seenAlerts = new Set();
        
        for (const alert of response.alerts) {
          // Create a unique key from multiple fields
          const uniqueKey = `${alert.event}|${alert.area}|${alert.severity}|${alert.headline || ''}|${alert.onset || ''}`;
          
          if (!seenAlerts.has(uniqueKey)) {
            seenAlerts.add(uniqueKey);
            uniqueAlerts.push(alert);
          }
        }
        
        console.log(`[Dashboard] Removed ${response.alerts.length - uniqueAlerts.length} duplicate alerts`);
        
        // Sort by severity
        const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1, 'Unknown': 0 };
        const sortedAlerts = uniqueAlerts.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));
        setAlerts(sortedAlerts);
        
        // Extract and set map data if available
        if (response.map_data) {
          console.log('[Dashboard] Setting map data from response:', response.map_data);
          if (response.map_data.markers && Array.isArray(response.map_data.markers)) {
            setMapMarkers(response.map_data.markers);
          }
          if (response.map_data.center) {
            setMapView({
              center: [response.map_data.center.lat, response.map_data.center.lng],
              zoom: response.map_data.zoom || 7
            });
          }
        }
        
        if (sortedAlerts.length > 0) {
          setAgentResponse(`Found ${sortedAlerts.length} unique alerts for ${currentLocation}.`);
        } else {
          setAgentResponse(`No active alerts found for ${currentLocation}.`);
        }
      } else {
        setAgentResponse(response?.insights || `No active alerts found for ${currentLocation}.`);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
      setAgentResponse('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSevereWeatherEvents = async () => {
    if (loadingEvents) return;
    
    setLoadingEvents(true);
    try {
      const response = await api.getSevereWeatherEvents();
      
      // Parse the response to extract severe weather events
      const events = parseSevereWeatherEvents(response);
      setSevereEvents(events);
    } catch (error) {
      console.error('Failed to load severe weather events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const parseSevereWeatherEvents = (response) => {
    const events = [];
    const seenStorms = new Set(); // Track unique storms
    
    // Parse hurricanes from response
    if (response.hurricanes?.content) {
      const hurricaneText = response.hurricanes.content.toLowerCase();
      
      // Look for hurricane/tropical storm mentions
      if (hurricaneText.includes('hurricane') || hurricaneText.includes('tropical storm')) {
        // Extract storm names and details (simplified parsing)
        const lines = response.hurricanes.content.split('\n');
        
        for (const line of lines) {
          // Skip lines that are just about hurricane path/visualization
          const lowerLine = line.toLowerCase();
          if (lowerLine.includes('hurricane path') || 
              lowerLine.includes('view hurricane') ||
              lowerLine.includes('visualization') ||
              lowerLine.includes('view in google earth') ||
              lowerLine.includes('download kmz') ||
              lowerLine.includes('how to view') ||
              lowerLine.includes('forecast cone') ||
              lowerLine.includes('track path') ||
              line.trim().startsWith('**View') ||
              line.trim().startsWith('**Download') ||
              line.trim().startsWith('**How to')) {
            continue;
          }
          
          if (line.includes('Hurricane') || line.includes('Tropical Storm')) {
            const nameMatch = line.match(/(Hurricane|Tropical Storm)\s+(\w+)/i);
            if (nameMatch) {
              const stormName = nameMatch[2];
              
              // Skip if we've already seen this storm
              if (seenStorms.has(stormName)) {
                continue;
              }
              seenStorms.add(stormName);
              
              // Extract a shorter description (first sentence or up to 100 chars)
              const fullDesc = line.trim();
              const shortDesc = fullDesc.length > 100 ? fullDesc.substring(0, 100) + '...' : fullDesc;
              
              const currentStorm = {
                type: 'hurricane',
                name: `${nameMatch[1]} ${nameMatch[2]}`,
                location: 'Atlantic/Pacific',
                severity: line.toLowerCase().includes('hurricane') ? 'Extreme' : 'Severe',
                description: shortDesc,
                fullDescription: fullDesc,
                details: {},
                trackUrl: 'https://www.nhc.noaa.gov/',
                advisoryUrl: 'https://www.nhc.noaa.gov/',
                lastUpdate: new Date().toISOString()
              };
              
              // Extract wind speed if present
              const windMatch = line.match(/(\d+)\s*mph/i);
              if (windMatch) {
                currentStorm.details.windSpeed = `${windMatch[1]} mph`;
              }
              
              events.push(currentStorm);
            }
          }
        }
      }
    }
    
    // Parse severe alerts from response
    if (response.alerts?.content) {
      const alertText = response.alerts.content;
      const lines = alertText.split('\n');
      
      for (const line of lines) {
        // Look for heat wave mentions
        if (line.toLowerCase().includes('heat') && line.toLowerCase().includes('warning')) {
          const fullDesc = line.trim();
          const shortDesc = fullDesc.length > 100 ? fullDesc.substring(0, 100) + '...' : fullDesc;
          events.push({
            type: 'heat',
            name: 'Heat Wave',
            location: extractLocation(line) || 'Multiple States',
            severity: 'Severe',
            description: shortDesc,
            fullDescription: fullDesc,
            details: {},
            lastUpdate: new Date().toISOString()
          });
        }
        
        // Look for flood mentions
        if (line.toLowerCase().includes('flood') && line.toLowerCase().includes('warning')) {
          const fullDesc = line.trim();
          const shortDesc = fullDesc.length > 100 ? fullDesc.substring(0, 100) + '...' : fullDesc;
          events.push({
            type: 'flood',
            name: 'Flood Warning',
            location: extractLocation(line) || 'Multiple Areas',
            severity: 'Severe',
            description: shortDesc,
            fullDescription: fullDesc,
            details: {},
            lastUpdate: new Date().toISOString()
          });
        }
      }
    }
    
    // Limit to top 6 most severe events
    return events.slice(0, 6);
  };

    const loadNationalSevereAlerts = async () => {
    if (loading) return;
    setLoading(true);
    try {
      console.log('[Dashboard] Loading national severe alerts...');
      const response = await api.getAlerts('United States');
      if (response && response.alerts && response.alerts.length > 0) {
        const sortedAlerts = response.alerts.sort((a, b) => {
          const severityOrder = { 'Extreme': 4, 'Severe': 3, 'Moderate': 2, 'Minor': 1, 'Unknown': 0 };
          return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
        });
        setAlerts(sortedAlerts);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to load national severe alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const extractLocation = (text) => {
    // Simple location extraction - look for state names
    const states = ['California', 'Texas', 'Florida', 'New York', 'Arizona', 'Nevada', 'Louisiana'];
    for (const state of states) {
      if (text.includes(state)) {
        return state;
      }
    }
    return null;
  };


  const handleStateSelect = (stateCode) => {
    setSelectedState(stateCode);
    setSelectedRegion(''); // Clear region when selecting individual state
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  const handleApplyState = () => {
    if (!selectedState) {
      setAgentResponse('Please select a state');
      return;
    }
    
    setSelectedRegion(''); // Clear region selection when using custom state
    setLocation(selectedState);
    setIsDropdownOpen(false); // Close dropdown after applying
    loadAlerts(selectedState);
  };

  const handleClearState = () => {
    setSelectedState('');
    setSelectedRegion('');
  };

  const handleShowOnMap = async (alert, alertIndex) => {
    console.log('[Dashboard] Show on Map clicked for alert:', alert, 'at index:', alertIndex);
    
    // Use index as the unique identifier to avoid issues with duplicate alert data
    setIsLoadingMap(true);
    setLoadingMapForAlert(alertIndex);
    
    // In demo mode during tour, map markers are already set
    if (isDemoMode && isTourActive) {
      console.log('[Dashboard] Demo mode - scrolling to map');
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoadingMap(false);
      setLoadingMapForAlert(null);
      // Just scroll to the map
      const mapElement = document.querySelector('[data-tour-id="dashboard-map"]');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // For live mode or non-tour demo mode, try to get map data
    try {
      // If alert has affected_zones, use those
      if (alert.affected_zones && alert.affected_zones.length > 0) {
        console.log('[Dashboard] Fetching map for affected zones:', alert.affected_zones);
        const mapData = await api.getMapForZones(alert.affected_zones);
        
        // Check for error response
        if (mapData && mapData.map_data && mapData.map_data.error) {
          console.log('[Dashboard] Map API returned error:', mapData.map_data.error);
          // Show user-friendly error message using window.alert to avoid naming conflict
          window.alert(`Unable to generate map: ${mapData.map_data.error}`);
        } else if (mapData && mapData.map_data && mapData.map_data.markers) {
          console.log('[Dashboard] Setting map markers:', mapData.map_data.markers);
          setMapMarkers(mapData.map_data.markers);
          if (mapData.map_data.center) {
            setMapView({ 
              center: [mapData.map_data.center.lat, mapData.map_data.center.lng], 
              zoom: 7 
            });
          }
        }
      } else {
        // Create a marker from the alert's area information
        console.log('[Dashboard] No affected zones, creating marker from alert area:', alert.area);
        
        // Try to use existing map markers if available, or create a simple marker
        if (mapMarkers && mapMarkers.length > 0) {
          // Keep existing markers and scroll
          console.log('[Dashboard] Using existing map markers');
        } else {
          // Create a basic marker for the alert location
          // This is a fallback - ideally the alert should have coordinates
          console.log('[Dashboard] No markers available, using default US center');
          setMapView({
            center: [39.8283, -98.5795],
            zoom: 4
          });
        }
      }
      
      setIsLoadingMap(false);
      setLoadingMapForAlert(null);
      
      // Scroll to map after loading
      const mapElement = document.querySelector('[data-tour-id="dashboard-map"]');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Failed to get map data for zones:', error);
      setIsLoadingMap(false);
      setLoadingMapForAlert(null);
      // Still scroll to map even if API fails
      const mapElement = document.querySelector('[data-tour-id="dashboard-map"]');
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleSelectRegion = (regionName, regionStates) => {
    setSelectedRegion(regionName);
    setSelectedState(''); // Clear individual state selection
    setIsDropdownOpen(false); // Close dropdown
    setLocation(regionStates);
    loadAlerts(regionStates);
  };


  const handleRefresh = () => {
    // Reset session to get fresh data
    api.resetSession();
    
    // Clear local state
    sessionStorage.removeItem('weatherAlerts');
    localStorage.removeItem('dashboardResponse');
    localStorage.removeItem('dashboardLocation');
    localStorage.removeItem('dashboardSevereEvents');
    localStorage.removeItem('dashboardAlerts');
    setLocation('');
    setSevereEvents([]);
    setAlerts([]);
    setAgentResponse('');
    
    // Reload both severe weather events and national alerts
    loadSevereWeatherEvents();
    loadNationalSevereAlerts();
  };

  const quickActions = [
    { name: 'Get Forecast', icon: MagnifyingGlassIcon, href: '/forecast', color: 'bg-blue-500' },
    { name: 'Chat with Agent', icon: ExclamationTriangleIcon, href: '/chat', color: 'bg-red-500' },
    { name: 'Find Shelters', icon: MapPinIcon, href: '/emergency-resources', color: 'bg-green-500' },
    { name: 'Evacuation Routes', icon: MapIcon, href: '/emergency-resources', color: 'bg-purple-500' },
    { name: 'Risk Analysis', icon: ChartBarIcon, href: '/risk-analysis', color: 'bg-orange-500' },
    { name: 'Find Hospitals', icon: BuildingOffice2Icon, href: '/emergency-resources', color: 'bg-teal-500' },
  ];

  const regions = [
    { name: 'National', value: 'National', displayName: 'National', icon: '🇺🇸' },
    { name: 'West', value: 'CA,OR,WA,NV,AZ,ID,MT,WY,CO,UT,NM,AK,HI', displayName: 'Western US', icon: '🏔️' },
    { name: 'Midwest', value: 'IL,IN,IA,KS,MI,MN,MO,NE,ND,OH,SD,WI', displayName: 'Midwest US', icon: '🌾' },
    { name: 'South', value: 'AL,AR,DE,FL,GA,KY,LA,MD,MS,NC,OK,SC,TN,TX,VA,WV', displayName: 'Southern US', icon: '🌴' },
    { name: 'Northeast', value: 'CT,ME,MA,NH,NJ,NY,PA,RI,VT', displayName: 'Northeast US', icon: '🍂' },
  ];

  const allUSStates = [
    { code: 'AL', name: 'Alabama', region: 'South' },
    { code: 'AK', name: 'Alaska', region: 'West' },
    { code: 'AZ', name: 'Arizona', region: 'West' },
    { code: 'AR', name: 'Arkansas', region: 'South' },
    { code: 'CA', name: 'California', region: 'West' },
    { code: 'CO', name: 'Colorado', region: 'West' },
    { code: 'CT', name: 'Connecticut', region: 'Northeast' },
    { code: 'DE', name: 'Delaware', region: 'South' },
    { code: 'FL', name: 'Florida', region: 'South' },
    { code: 'GA', name: 'Georgia', region: 'South' },
    { code: 'HI', name: 'Hawaii', region: 'West' },
    { code: 'ID', name: 'Idaho', region: 'West' },
    { code: 'IL', name: 'Illinois', region: 'Midwest' },
    { code: 'IN', name: 'Indiana', region: 'Midwest' },
    { code: 'IA', name: 'Iowa', region: 'Midwest' },
    { code: 'KS', name: 'Kansas', region: 'Midwest' },
    { code: 'KY', name: 'Kentucky', region: 'South' },
    { code: 'LA', name: 'Louisiana', region: 'South' },
    { code: 'ME', name: 'Maine', region: 'Northeast' },
    { code: 'MD', name: 'Maryland', region: 'South' },
    { code: 'MA', name: 'Massachusetts', region: 'Northeast' },
    { code: 'MI', name: 'Michigan', region: 'Midwest' },
    { code: 'MN', name: 'Minnesota', region: 'Midwest' },
    { code: 'MS', name: 'Mississippi', region: 'South' },
    { code: 'MO', name: 'Missouri', region: 'Midwest' },
    { code: 'MT', name: 'Montana', region: 'West' },
    { code: 'NE', name: 'Nebraska', region: 'Midwest' },
    { code: 'NV', name: 'Nevada', region: 'West' },
    { code: 'NH', name: 'New Hampshire', region: 'Northeast' },
    { code: 'NJ', name: 'New Jersey', region: 'Northeast' },
    { code: 'NM', name: 'New Mexico', region: 'West' },
    { code: 'NY', name: 'New York', region: 'Northeast' },
    { code: 'NC', name: 'North Carolina', region: 'South' },
    { code: 'ND', name: 'North Dakota', region: 'Midwest' },
    { code: 'OH', name: 'Ohio', region: 'Midwest' },
    { code: 'OK', name: 'Oklahoma', region: 'South' },
    { code: 'OR', name: 'Oregon', region: 'West' },
    { code: 'PA', name: 'Pennsylvania', region: 'Northeast' },
    { code: 'RI', name: 'Rhode Island', region: 'Northeast' },
    { code: 'SC', name: 'South Carolina', region: 'South' },
    { code: 'SD', name: 'South Dakota', region: 'Midwest' },
    { code: 'TN', name: 'Tennessee', region: 'South' },
    { code: 'TX', name: 'Texas', region: 'South' },
    { code: 'UT', name: 'Utah', region: 'West' },
    { code: 'VT', name: 'Vermont', region: 'Northeast' },
    { code: 'VA', name: 'Virginia', region: 'South' },
    { code: 'WA', name: 'Washington', region: 'West' },
    { code: 'WV', name: 'West Virginia', region: 'South' },
    { code: 'WI', name: 'Wisconsin', region: 'Midwest' },
    { code: 'WY', name: 'Wyoming', region: 'West' },
    { code: 'DC', name: 'Washington DC', region: 'South' },
  ];

  return (
    <div className="space-y-6">
      <RiskAnalysisModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        analysis={riskAnalysis}
        isLoading={isAnalyzingRisk}
        alert={selectedAlertForAnalysis}
      />
      
      {/* New Compact Location Selector */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Region Selector */}
          <div className="col-span-1">
            <label htmlFor="region-select" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => handleSelectRegion(e.target.value, regions.find(r => r.name === e.target.value)?.value || '')}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm"
            >
              {regions.map(region => (
                <option key={region.name} value={region.name}>{region.icon} {region.displayName}</option>
              ))}
            </select>
          </div>

          {/* State Selector */}
          <div className="col-span-1">
            <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              id="state-select"
              value={selectedState}
              onChange={(e) => handleStateSelect(e.target.value)}
              className="w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm"
            >
              <option value="">-- Select a State --</option>
              {allUSStates.map(state => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
          </div>

          {/* Action Button */}
          <div className="col-span-1 self-end">
            <button
              onClick={handleApplyState}
              disabled={loading || (!selectedState && selectedRegion === 'National')}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="-ml-1 mr-2 h-5 w-5" />
              Get Alerts
            </button>
          </div>
        </div>
      </div>


      {/* Active Alerts Section */}
      <div className="bg-white rounded-lg shadow-md p-6" data-tour-id={isTourActive && isDemoMode ? "alerts-section" : undefined}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {alerts.length > 0 && !location ? '🚨 Severe Weather Alerts' : `Active Alerts${location && agentResponse ? ` - ${location === 'all US states' ? 'National' : location}` : ''}`}
          </h2>
          <div className="flex items-center gap-4">
            {alerts.length > alertsPerPage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAlertPage(p => Math.max(0, p - 1))}
                  disabled={alertPage === 0}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-700" />
                </button>
                <span className="text-sm text-gray-600">
                  {alertPage + 1} / {Math.ceil(alerts.length / alertsPerPage)}
                </span>
                <button
                  onClick={() => setAlertPage(p => Math.min(Math.ceil(alerts.length / alertsPerPage) - 1, p + 1))}
                  disabled={(alertPage + 1) * alertsPerPage >= alerts.length}
                  className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 text-primary hover:text-blue-900 text-sm font-medium disabled:opacity-50"
            >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
         </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : alerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {alerts.slice(alertPage * alertsPerPage, (alertPage + 1) * alertsPerPage).map((alert, index) => {
              // Calculate the actual index in the full alerts array
              const actualIndex = alertPage * alertsPerPage + index;
              return (
                <SevereWeatherCard 
                  key={index} 
                  event={alert}
                  alertIndex={actualIndex}
                  onAnalyzeRisk={handleAnalyzeRisk} 
                  onShowOnMap={handleShowOnMap}
                  isLoadingMap={loadingMapForAlert === actualIndex}
                />
              );
            })}
          </div>
        ) : agentResponse ? (
          <div className="text-center py-12 text-gray-500">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">{agentResponse}</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-600 mb-2">No Location Selected</p>
            <p className="text-sm text-gray-500">Please select a region, state, or enter a custom location to view active alerts.</p>
          </div>
        )}
      </div>

      {/* Bottom Section: Map and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Map */}
        <div className="lg:col-span-4 bg-white rounded-lg shadow-md p-4" data-tour-id="dashboard-map">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Regional Map</h2>
          <div className="h-[400px] w-full rounded-lg overflow-hidden">
            <LocationMap 
              center={mapView.center} 
              zoom={mapView.zoom} 
              markers={mapMarkers} 
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚡ Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className={`w-full flex items-center p-2 text-left text-white ${action.color} rounded-lg hover:opacity-90 transition-opacity`}
              >
                <action.icon className="h-5 w-5 mr-2 text-white" />
                <span className="font-medium text-sm">{action.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;