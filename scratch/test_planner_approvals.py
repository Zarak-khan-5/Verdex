import requests
import json

def test_planner_approvals_flow():
    base_url = "http://localhost:8000/api"
    print("Starting City Planner signup approvals flow verification...")

    test_email = "testplanner_approval@verdex.io"
    test_password = "password123"
    test_name = "Approved Planner Test"

    # Step 1: Submit City Planner (client) signup request
    print("\n1. Registering as City Planner (client)...")
    reg_payload = {
        "name": test_name,
        "email": test_email,
        "password": test_password,
        "role": "client"
      }
    
    r_reg = requests.post(f"{base_url}/auth/register", json=reg_payload)
    print(f"Status Code: {r_reg.status_code}")
    assert r_reg.status_code == 200, f"Register should return 200, got {r_reg.status_code}"
    
    reg_data = r_reg.json()
    print("Registration Response:")
    print(json.dumps(reg_data, indent=2))
    
    assert reg_data.get("status") == "pending_approval", "Should have pending_approval status"
    assert reg_data.get("token") is None, "Should not return a token"
    assert reg_data.get("user_id") is None, "Should not return a user ID"

    # Step 2: Get Pending Approvals List (Admin view)
    print("\n2. Fetching pending approvals list...")
    r_list = requests.get(f"{base_url}/auth/admin/approvals")
    assert r_list.status_code == 200
    pendings = r_list.json()
    print(f"Total pending requests in queue: {len(pendings)}")
    
    # Find our request
    target_request = None
    for p in pendings:
        if p.get("email") == test_email:
            target_request = p
            break
            
    assert target_request is not None, "Pending signup must be in approvals list"
    request_id = target_request["request_id"]
    print(f"Found request in queue! Request ID: {request_id}")

    # Step 3: Approve request
    print(f"\n3. Approving request {request_id}...")
    r_app = requests.post(f"{base_url}/auth/admin/approvals/{request_id}/approve")
    print(f"Status Code: {r_app.status_code}")
    assert r_app.status_code == 200
    app_data = r_app.json()
    print(json.dumps(app_data, indent=2))
    assert app_data.get("status") == "success"

    # Step 4: Verify request deleted from queue
    print("\n4. Checking approvals list again...")
    r_list2 = requests.get(f"{base_url}/auth/admin/approvals")
    pendings2 = r_list2.json()
    assert not any(p.get("request_id") == request_id for p in pendings2), "Approved request must be removed from queue"
    print("Confirmed: Request removed from queue.")

    # Step 5: Log in with approved credentials
    print("\n5. Testing login with approved credentials...")
    login_payload = {
        "email": test_email,
        "password": test_password
    }
    r_log = requests.post(f"{base_url}/auth/login", json=login_payload)
    print(f"Status Code: {r_log.status_code}")
    assert r_log.status_code == 200, "Approved user should login successfully"
    log_data = r_log.json()
    print("Login Response:")
    print(json.dumps(log_data, indent=2))
    
    assert log_data.get("token") is not None, "Should return a token"
    assert log_data.get("role") == "client", "Role should be client (city planner)"
    user_id = log_data.get("user_id")

    # Step 6: Clean up the user from DB
    print(f"\n6. Cleaning up test user {user_id}...")
    r_del = requests.delete(f"{base_url}/auth/admin/users/{user_id}")
    print(f"Status Code: {r_del.status_code}")
    assert r_del.status_code == 200, "Clean up delete should succeed"
    print("Workflow verification completed successfully!")

if __name__ == "__main__":
    test_planner_approvals_flow()
