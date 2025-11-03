import React, { createContext, useContext, useState } from 'react';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(() => {
    return localStorage.getItem('tourCompleted') === 'true';
  });

  const tourSteps = [
    {
      id: 'welcome',
      title: '🎬 Welcome to the Demo Tour!',
      description: 'Let me show you how our Weather Insights platform helps you stay safe during severe weather events. This demo features a realistic Hurricane Milton scenario.',
      page: '/',
      highlight: null,
      position: 'center'
    },
    {
      id: 'demo-mode',
      title: '🎯 Demo Mode',
      description: 'Notice the yellow "DEMO MODE" button in the top right. This means you\'re viewing realistic mock data. You can switch to live data anytime by clicking it.',
      page: '/',
      highlight: 'demo-toggle',
      position: 'bottom'
    },
    {
      id: 'dashboard-alerts-scroll',
      title: '⚠️ Severe Weather Alerts',
      description: 'Below the selectors, you\'ll see 4 active weather alert cards. Notice Hurricane Milton (Category 4) - the most critical threat. Each card shows the alert type, severity, location, and key details. You can scroll through multiple alerts using the navigation arrows.',
      page: '/',
      highlight: 'alerts-section',
      position: 'top'
    },
    {
      id: 'risk-analysis-button',
      title: '📊 Comprehensive Risk Analysis',
      description: 'Watch as we automatically open the risk analysis for Hurricane Milton. This shows 8 categories of real-time intelligence: current impacts, infrastructure damage, active hazards, injuries/casualties, safety recommendations, emergency response, affected areas, and official sources.',
      page: '/',
      highlight: 'alerts-section',
      position: 'top'
    },
    {
      id: 'risk-analysis-modal',
      title: '🔍 Detailed Risk Information',
      description: 'Review the comprehensive risk analysis modal. Notice how it provides specific, actionable information across multiple categories - all powered by live web searches and AI analysis. This helps you understand the full scope of the threat.',
      page: '/',
      highlight: 'alerts-section',
      position: 'top'
    },
    {
      id: 'show-map-button',
      title: '🗺️ Map Visualization',
      description: 'Now we\'ll automatically close the risk analysis and show you the alert on the map. The map helps you visualize the geographic extent of the threat and affected areas.',
      page: '/',
      highlight: 'alerts-section',
      position: 'top'
    },
    {
      id: 'dashboard-map',
      title: '📍 Interactive Alert Map',
      description: 'Scroll down to see the interactive map. Red markers indicate extreme threats. The map shows the geographic extent of alerts and helps you understand which areas are affected.',
      page: '/',
      highlight: 'dashboard-map',
      position: 'top'
    },
    {
      id: 'emergency-resources',
      title: '🏥 Emergency Resources',
      description: 'Find nearby shelters, hospitals, and evacuation routes. See real-time capacity, amenities, and contact information. Critical for evacuation planning.',
      page: '/emergency-resources',
      highlight: 'resources-section',
      position: 'top'
    },
    {
      id: 'chat-page',
      title: '💬 Context-Aware AI Assistant',
      description: 'Ask questions about weather conditions, get personalized safety advice, and receive real-time updates. The AI maintains conversation context - you can ask follow-up questions like "analyze the risks for each of these alerts" and it will remember previous responses.',
      page: '/chat',
      highlight: 'chat-interface',
      position: 'top'
    },
    {
      id: 'forecast-page',
      title: '📊 Detailed Forecast',
      description: 'See hour-by-hour and daily forecasts. Watch how conditions deteriorate as Hurricane Milton approaches - winds increasing from 25 mph to 150+ mph.',
      page: '/forecast',
      highlight: 'forecast-section',
      position: 'top'
    },
    {
      id: 'hurricane-simulation',
      title: '🌀 Hurricane Impact Analysis',
      description: 'Advanced simulation showing storm surge, wind speeds, rainfall totals, and evacuation priorities. Identifies high-risk locations that need immediate evacuation.',
      page: '/hurricane-simulation',
      highlight: 'simulation-section',
      position: 'top'
    },
    {
      id: 'complete',
      title: '✅ Tour Complete!',
      description: 'You\'ve seen all the key features! Feel free to explore on your own. Toggle between Demo and Live modes anytime. Stay safe! 🌤️',
      page: '/hurricane-simulation',
      highlight: null,
      position: 'center'
    }
  ];

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skipTour = () => {
    setIsTourActive(false);
    setCurrentStep(0);
  };

  const completeTour = () => {
    setIsTourActive(false);
    setCurrentStep(0);
    setHasCompletedTour(true);
    localStorage.setItem('tourCompleted', 'true');
  };

  const resetTour = () => {
    setHasCompletedTour(false);
    localStorage.removeItem('tourCompleted');
  };

  const getCurrentStep = () => tourSteps[currentStep];

  return (
    <TourContext.Provider
      value={{
        isTourActive,
        currentStep,
        tourSteps,
        hasCompletedTour,
        startTour,
        nextStep,
        previousStep,
        skipTour,
        completeTour,
        resetTour,
        getCurrentStep
      }}
    >
      {children}
    </TourContext.Provider>
  );
};
