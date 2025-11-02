#!/usr/bin/env python3
"""
Test script for get_nws_alerts function with REAL NWS API calls
No mocking - tests actual API integration
"""

import sys
import os
from datetime import datetime
from unittest.mock import Mock

# Add the agents directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agents', 'shared_tools'))

# Import the function
from tools import get_nws_alerts

def test_real_national_alerts():
    """Test with real national alerts from NWS API"""
    print("\n" + "="*80)
    print("TEST 1: Real National Alerts (No parameters)")
    print("="*80)
    
    mock_context = Mock()
    mock_context.state = {}
    
    print("Calling NWS API for national alerts...")
    result = get_nws_alerts(mock_context)
    
    print(f"\nAPI Response Status: {result.get('status')}")
    print(f"Total alerts returned: {result.get('returned_count', 0)}")
    print(f"Total count (before filtering): {result.get('total_count', 0)}")
    
    if result.get('status') == 'success':
        alerts = result.get('alerts', [])
        
        print(f"\n{'='*80}")
        print("FILTERING VERIFICATION:")
        print(f"{'='*80}")
        
        # Check severity filtering
        severities = [alert['severity'] for alert in alerts]
        severity_set = set(severities)
        print(f"Severities found: {severity_set}")
        
        if severity_set:
            all_critical = all(s in ['Extreme', 'Severe'] for s in severities)
            if all_critical:
                print("✅ Severity Filter: PASSED - Only Extreme/Severe alerts")
            else:
                print("❌ Severity Filter: FAILED - Found non-critical severities")
                return False
        else:
            print("⚠️  No alerts returned (may be no active Extreme/Severe alerts)")
        
        # Check expiration filtering
        print(f"\n{'='*80}")
        print("EXPIRATION CHECK:")
        print(f"{'='*80}")
        
        current_time = datetime.now()
        expired_count = 0
        valid_count = 0
        
        for i, alert in enumerate(alerts[:10], 1):  # Check first 10
            expires = alert.get('expires')
            if expires:
                try:
                    expire_time = datetime.fromisoformat(expires.replace('Z', '+00:00'))
                    hours_until_expiry = (expire_time - current_time).total_seconds() / 3600
                    
                    if expire_time > current_time:
                        valid_count += 1
                        status = "✅ VALID"
                    else:
                        expired_count += 1
                        status = "❌ EXPIRED"
                    
                    print(f"{i}. {alert['event'][:40]:40} | {status} | Expires in {hours_until_expiry:6.1f} hours")
                except Exception as e:
                    print(f"{i}. {alert['event'][:40]:40} | ⚠️  Parse Error: {str(e)}")
            else:
                print(f"{i}. {alert['event'][:40]:40} | ⚠️  No expiration time")
        
        print(f"\nExpiration Summary:")
        print(f"  Valid (not expired): {valid_count}")
        print(f"  Expired: {expired_count}")
        
        if expired_count > 0:
            print("❌ Expiration Filter: FAILED - Found expired alerts")
            return False
        else:
            print("✅ Expiration Filter: PASSED - No expired alerts found")
        
        # Show sample alerts
        if alerts:
            print(f"\n{'='*80}")
            print("SAMPLE ALERTS (First 5):")
            print(f"{'='*80}")
            for i, alert in enumerate(alerts[:5], 1):
                print(f"\n{i}. Event: {alert['event']}")
                print(f"   Severity: {alert['severity']}")
                print(f"   Headline: {alert.get('headline', 'N/A')[:80]}")
                expires = alert.get('expires')
                if expires:
                    try:
                        expire_time = datetime.fromisoformat(expires.replace('Z', '+00:00'))
                        print(f"   Expires: {expire_time.strftime('%Y-%m-%d %H:%M %Z')}")
                    except:
                        print(f"   Expires: {expires}")
        
        return True
    else:
        print(f"❌ API call failed: {result.get('message', 'Unknown error')}")
        return False

def test_real_state_alerts():
    """Test with real state-specific alerts (California)"""
    print("\n" + "="*80)
    print("TEST 2: Real State Alerts (California)")
    print("="*80)
    
    mock_context = Mock()
    mock_context.state = {}
    
    print("Calling NWS API for California alerts...")
    result = get_nws_alerts(mock_context, state="CA")
    
    print(f"\nAPI Response Status: {result.get('status')}")
    print(f"Total alerts returned: {result.get('returned_count', 0)}")
    
    if result.get('status') == 'success':
        alerts = result.get('alerts', [])
        
        if alerts:
            print(f"\nSample California Alerts:")
            for i, alert in enumerate(alerts[:3], 1):
                print(f"\n{i}. {alert['event']} ({alert['severity']})")
                print(f"   Zones: {len(alert.get('affected_zones', []))} zones affected")
        else:
            print("⚠️  No Extreme/Severe alerts currently active in California")
        
        return True
    else:
        print(f"❌ API call failed: {result.get('message', 'Unknown error')}")
        return False

def test_real_point_alerts():
    """Test with real point-based alerts (Miami, FL)"""
    print("\n" + "="*80)
    print("TEST 3: Real Point Alerts (Miami, FL: 25.7617, -80.1918)")
    print("="*80)
    
    mock_context = Mock()
    mock_context.state = {}
    
    print("Calling NWS API for Miami point alerts...")
    result = get_nws_alerts(mock_context, latitude=25.7617, longitude=-80.1918)
    
    print(f"\nAPI Response Status: {result.get('status')}")
    print(f"Total alerts returned: {result.get('returned_count', 0)}")
    
    if result.get('status') == 'success':
        alerts = result.get('alerts', [])
        
        if alerts:
            print(f"\nSample Miami Alerts:")
            for i, alert in enumerate(alerts[:3], 1):
                print(f"\n{i}. {alert['event']} ({alert['severity']})")
                print(f"   Description: {alert.get('description', 'N/A')[:100]}...")
        else:
            print("⚠️  No Extreme/Severe alerts currently active in Miami area")
        
        return True
    else:
        print(f"❌ API call failed: {result.get('message', 'Unknown error')}")
        return False

def run_real_api_tests():
    """Run all real API tests"""
    print("\n" + "="*80)
    print("REAL NWS API INTEGRATION TESTS")
    print("Testing with actual NWS API calls (no mocking)")
    print("="*80)
    
    tests = [
        ("National Alerts", test_real_national_alerts),
        ("State Alerts (CA)", test_real_state_alerts),
        ("Point Alerts (Miami)", test_real_point_alerts),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
                print(f"\n✅ {test_name}: PASSED")
            else:
                failed += 1
                print(f"\n❌ {test_name}: FAILED")
        except Exception as e:
            print(f"\n❌ ERROR in {test_name}: {str(e)}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "="*80)
    print("REAL API TEST SUMMARY")
    print("="*80)
    print(f"Total tests: {len(tests)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print("="*80)
    
    if failed == 0:
        print("\n🎉 All real API tests passed! Function is working correctly with live NWS data.")
    else:
        print("\n⚠️  Some tests failed. Review the output above for details.")
    
    return failed == 0

if __name__ == "__main__":
    success = run_real_api_tests()
    sys.exit(0 if success else 1)
