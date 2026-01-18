"""Pass 1: Landing Page & Authentication Flow Testing"""
from playwright.sync_api import sync_playwright
import json

def test_pass1():
    results = {
        "pass": 1,
        "focus": "Landing Page & Authentication",
        "bugs": [],
        "ux_observations": [],
        "console_errors": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # Capture console errors
        page.on("console", lambda msg: results["console_errors"].append(msg.text) if msg.type == "error" else None)

        print("=== PASS 1: Landing Page & Authentication ===\n")

        # Test 1: Landing page loads
        print("Test 1: Loading landing page...")
        page.goto("http://localhost:3333")
        page.wait_for_load_state("networkidle")
        page.screenshot(path="/tmp/pass1_01_landing.png", full_page=True)
        print(f"  Current URL: {page.url}")
        print("  ✓ Landing page loaded successfully")

        # Test 2: Check landing page elements
        print("\nTest 2: Checking landing page elements...")
        sign_in_btn = page.locator("text=Sign In")
        get_started_btn = page.locator("a:has-text('Get Started')").first

        print(f"  Sign In button visible: {sign_in_btn.is_visible()}")
        print(f"  Get Started button visible: {get_started_btn.is_visible()}")

        if sign_in_btn.is_visible():
            print("  ✓ Navigation buttons present")
        else:
            results["bugs"].append({
                "severity": "High",
                "description": "Sign In button not visible on landing page",
                "location": "src/app/page.tsx"
            })

        # Test 3: Navigate to login page
        print("\nTest 3: Navigating to login page...")
        page.goto("http://localhost:3333/auth/login")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000)
        page.screenshot(path="/tmp/pass1_02_login.png", full_page=True)
        print(f"  Current URL: {page.url}")

        # Test 4: Check dev auth endpoint
        print("\nTest 4: Checking dev auth endpoint...")
        response = page.request.get("http://localhost:3333/api/auth/dev-check")
        dev_check = response.json()
        print(f"  Dev auth bypass enabled: {dev_check.get('devAuthBypass', False)}")

        # Test 5: Wait for auto-login or check login buttons
        print("\nTest 5: Checking login page state...")
        page.wait_for_timeout(3000)
        page.screenshot(path="/tmp/pass1_03_after_wait.png", full_page=True)
        current_url = page.url
        print(f"  Current URL after wait: {current_url}")

        if "/dashboard" in current_url:
            print("  ✓ Auto-login successful - redirected to dashboard")
        else:
            print("  Still on login page - checking buttons...")
            # Check for login buttons
            github_btn = page.locator("text=Continue with GitHub")
            google_btn = page.locator("text=Continue with Google")
            dev_btn = page.locator("text=Dev Login")

            print(f"    GitHub button: {github_btn.is_visible()}")
            print(f"    Google button: {google_btn.is_visible()}")
            print(f"    Dev Login button: {dev_btn.is_visible()}")

            # Try dev login if available
            if dev_btn.is_visible():
                print("\n  Clicking Dev Login button...")
                dev_btn.click()
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(3000)
                page.screenshot(path="/tmp/pass1_04_after_dev_login.png", full_page=True)
                print(f"  Current URL after dev login: {page.url}")

        # Test 6: Check session state
        print("\nTest 6: Checking session state...")
        session_response = page.request.get("http://localhost:3333/api/auth/session")
        try:
            session_data = session_response.json()
            if session_data and session_data.get("user"):
                print(f"  ✓ User session established: {session_data['user'].get('name', 'Unknown')}")
            else:
                print("  ⚠ No active user session")
                results["bugs"].append({
                    "severity": "High",
                    "description": "Dev login not creating session",
                    "location": "src/server/auth.ts"
                })
        except Exception as e:
            print(f"  ⚠ Session check failed: {e}")

        # Test 7: Try to access dashboard
        print("\nTest 7: Testing dashboard access...")
        page.goto("http://localhost:3333/dashboard")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path="/tmp/pass1_05_dashboard.png", full_page=True)
        print(f"  Dashboard URL: {page.url}")

        if "/auth/login" in page.url:
            print("  ⚠ Redirected to login - not authenticated")
            results["bugs"].append({
                "severity": "Critical",
                "description": "Cannot access dashboard after login attempt",
                "location": "Dashboard auth protection"
            })
        elif "/dashboard" in page.url:
            print("  ✓ Dashboard accessible")
            # Check for key elements
            page_content = page.content()
            has_sidebar = page.locator("nav").count() > 0 or "sidebar" in page_content.lower()
            print(f"    Sidebar present: {has_sidebar}")

        # UX Observations
        results["ux_observations"].append({
            "category": "Navigation",
            "location": "Landing page",
            "observation": "Clean hero section with clear CTA buttons",
            "priority": "P3"
        })

        # Report console errors
        if results["console_errors"]:
            print(f"\n⚠ Console errors found: {len(results['console_errors'])}")
            for err in results["console_errors"][:5]:
                print(f"  - {err[:100]}")
        else:
            print("\n✓ No console errors")

        # Summary
        print("\n" + "="*50)
        print("PASS 1 SUMMARY")
        print("="*50)
        print(f"Bugs found: {len(results['bugs'])}")
        for bug in results["bugs"]:
            print(f"  [{bug['severity']}] {bug['description']}")
        print(f"\nUX observations: {len(results['ux_observations'])}")
        print(f"\nScreenshots saved to /tmp/pass1_*.png")

        browser.close()

    return results

if __name__ == "__main__":
    test_pass1()
