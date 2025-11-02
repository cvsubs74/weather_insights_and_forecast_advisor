#!/usr/bin/env python3
"""
Test script for get_nws_alerts function with severity and expiration filtering
"""

import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch
import json

# Add the agents directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agents', 'shared_tools'))

# Import the function
from tools import get_nws_alerts

def create_mock_alert(event_type, severity, expires_offset_hours=24):
    """Create a mock alert with specified properties"""
    expires_time = datetime.now() + timedelta(hours=expires_offset_hours)
    return {
        "properties": {
            "event": event_type,
            "severity": severity,
            "urgency": "Immediate",
            "certainty": "Likely",
            "headline": f"{event_type} in effect",
            "description": f"Test {event_type} description",
            "instruction": "Take shelter immediately",
            "onset": datetime.now().isoformat(),
            "expires": expires_time.isoformat(),
            "affectedZones": ["CAZ001"],
            "senderName": "NWS Test"
        }
    }

def test_severity_filtering():
    """Test that only Extreme and Severe alerts are returned"""
    print("\n" + "="*80)
    print("TEST 1: Severity Filtering (Extreme and Severe only)")
    print("="*80)
    
    mock_response_data = {
        "features": [
            create_mock_alert("Hurricane Warning", "Extreme", 48),
            create_mock_alert("Tornado Warning", "Severe", 24),
            create_mock_alert("Flood Watch", "Moderate", 36),
            create_mock_alert("Wind Advisory", "Minor", 12),
        ]
    }
    
    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()
    
    with patch('tools.requests.get', return_value=mock_response):
        mock_context = Mock()
        mock_context.state = {}
        
        result = get_nws_alerts(mock_context)
        
        print(f"Total alerts from API: 4")
        print(f"Alerts after severity filter: {len(result['alerts'])}")
        print(f"Expected: 2 (Extreme and Severe only)")
        
        severities = [alert['severity'] for alert in result['alerts']]
        print(f"Severities in result: {severities}")
        
        assert len(result['alerts']) == 2, f"Expected 2 alerts, got {len(result['alerts'])}"
        assert all(s in ['Extreme', 'Severe'] for s in severities), "Found non-critical severity"
        
        print("✅ PASSED: Only Extreme and Severe alerts returned")
        return True

def test_expiration_filtering():
    """Test that expired alerts are filtered out"""
    print("\n" + "="*80)
    print("TEST 2: Expiration Filtering (No expired alerts)")
    print("="*80)
    
    mock_response_data = {
        "features": [
            create_mock_alert("Hurricane Warning", "Extreme", 48),    # Valid: expires in 48 hours
            create_mock_alert("Tornado Warning", "Severe", 24),       # Valid: expires in 24 hours
            create_mock_alert("Severe Thunderstorm", "Severe", -2),   # Expired: 2 hours ago
            create_mock_alert("Flash Flood Warning", "Extreme", -5),  # Expired: 5 hours ago
        ]
    }
    
    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()
    
    with patch('tools.requests.get', return_value=mock_response):
        mock_context = Mock()
        mock_context.state = {}
        
        result = get_nws_alerts(mock_context)
        
        print(f"Total Extreme/Severe alerts: 4")
        print(f"Alerts after expiration filter: {len(result['alerts'])}")
        print(f"Expected: 2 (non-expired only)")
        
        for alert in result['alerts']:
            expires = alert.get('expires')
            if expires:
                expire_time = datetime.fromisoformat(expires.replace('Z', '+00:00'))
                hours_until_expiry = (expire_time - datetime.now()).total_seconds() / 3600
                print(f"  - {alert['event']}: expires in {hours_until_expiry:.1f} hours")
        
        assert len(result['alerts']) == 2, f"Expected 2 non-expired alerts, got {len(result['alerts'])}"
        
        print("✅ PASSED: Expired alerts filtered out correctly")
        return True

def test_combined_filtering():
    """Test both severity and expiration filtering together"""
    print("\n" + "="*80)
    print("TEST 3: Combined Filtering (Severity + Expiration)")
    print("="*80)
    
    mock_response_data = {
        "features": [
            create_mock_alert("Hurricane Warning", "Extreme", 48),      # ✓ Valid
            create_mock_alert("Tornado Warning", "Severe", 24),         # ✓ Valid
            create_mock_alert("Flood Watch", "Moderate", 36),           # ✗ Wrong severity
            create_mock_alert("Wind Advisory", "Minor", 12),            # ✗ Wrong severity
            create_mock_alert("Severe Thunderstorm", "Severe", -2),     # ✗ Expired
            create_mock_alert("Flash Flood Warning", "Extreme", -5),    # ✗ Expired
            create_mock_alert("Blizzard Warning", "Extreme", 72),       # ✓ Valid
        ]
    }
    
    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()
    
    with patch('tools.requests.get', return_value=mock_response):
        mock_context = Mock()
        mock_context.state = {}
        
        result = get_nws_alerts(mock_context)
        
        print(f"Total alerts from API: 7")
        print(f"After severity filter: 5 (Extreme/Severe)")
        print(f"After expiration filter: {len(result['alerts'])}")
        print(f"Expected: 3 (Extreme/Severe AND non-expired)")
        
        print("\nFinal alerts:")
        for alert in result['alerts']:
            expires = alert.get('expires')
            expire_time = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            hours_until_expiry = (expire_time - datetime.now()).total_seconds() / 3600
            print(f"  - {alert['event']} ({alert['severity']}): expires in {hours_until_expiry:.1f} hours")
        
        assert len(result['alerts']) == 3, f"Expected 3 valid alerts, got {len(result['alerts'])}"
        
        # Verify all are Extreme or Severe
        severities = [alert['severity'] for alert in result['alerts']]
        assert all(s in ['Extreme', 'Severe'] for s in severities), "Found non-critical severity"
        
        # Verify none are expired
        for alert in result['alerts']:
            expires = alert.get('expires')
            expire_time = datetime.fromisoformat(expires.replace('Z', '+00:00'))
            assert expire_time > datetime.now(), f"Found expired alert: {alert['event']}"
        
        print("✅ PASSED: Combined filtering works correctly")
        return True

def test_edge_cases():
    """Test edge cases like missing expiration times"""
    print("\n" + "="*80)
    print("TEST 4: Edge Cases (Missing expiration, invalid dates)")
    print("="*80)
    
    # Create alert with no expiration time
    alert_no_expiry = {
        "properties": {
            "event": "Special Weather Statement",
            "severity": "Severe",
            "urgency": "Immediate",
            "certainty": "Likely",
            "headline": "Special Weather Statement",
            "description": "Test description",
            "instruction": "Monitor conditions",
            "onset": datetime.now().isoformat(),
            "expires": None,  # No expiration
            "affectedZones": ["CAZ001"],
            "senderName": "NWS Test"
        }
    }
    
    mock_response_data = {
        "features": [
            create_mock_alert("Hurricane Warning", "Extreme", 48),
            alert_no_expiry,  # Alert with no expiration
        ]
    }
    
    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()
    
    with patch('tools.requests.get', return_value=mock_response):
        mock_context = Mock()
        mock_context.state = {}
        
        result = get_nws_alerts(mock_context)
        
        print(f"Alerts with missing expiration: {len([a for a in result['alerts'] if not a.get('expires')])}")
        print(f"Total alerts returned: {len(result['alerts'])}")
        print(f"Expected: 2 (both should be included)")
        
        assert len(result['alerts']) == 2, f"Expected 2 alerts, got {len(result['alerts'])}"
        
        print("✅ PASSED: Alerts without expiration times are included")
        return True

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*80)
    print("TESTING get_nws_alerts FUNCTION")
    print("Testing severity filtering (Extreme/Severe) and expiration filtering")
    print("="*80)
    
    tests = [
        ("Severity Filtering", test_severity_filtering),
        ("Expiration Filtering", test_expiration_filtering),
        ("Combined Filtering", test_combined_filtering),
        ("Edge Cases", test_edge_cases),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except AssertionError as e:
            print(f"❌ FAILED: {test_name}")
            print(f"   Error: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"❌ ERROR in {test_name}: {str(e)}")
            failed += 1
    
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total tests: {len(tests)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print("="*80)
    
    return failed == 0

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
