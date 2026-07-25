"""
Mission 3: Submit your gist URL to the HENNGE challenge API.
Pre-filled for: krishnaabhang2022@gmail.com

Just run:  python mission3_submit.py
"""

import hmac
import hashlib
import struct
import time
import base64
import json
import urllib.request
import urllib.error


def generate_totp(secret_bytes, time_step=30, t0=0, digits=10):
    """
    Generate a TOTP token per RFC 6238 using HMAC-SHA-512.
    """
    # Step 1: Compute T = floor((Current Unix Time - T0) / X)
    t = int((time.time() - t0) / time_step)

    # Step 2: Encode T as an 8-byte big-endian integer
    msg = struct.pack('>Q', t)

    # Step 3: Compute HMAC-SHA-512
    h = hmac.new(secret_bytes, msg, hashlib.sha512).digest()

    # Step 4: Dynamic Truncation (RFC 4226 Section 5.4)
    offset = h[-1] & 0x0F
    code = struct.unpack('>I', h[offset:offset + 4])[0]
    code = code & 0x7FFFFFFF

    # Step 5: Compute OTP = code mod 10^digits
    otp = code % (10 ** digits)

    return str(otp).zfill(digits)


def main():
    # Your details (pre-filled)
    email = "krishnaabhang2022@gmail.com"
    github_url = "https://gist.github.com/Krishna-cell-12/c633fd4351067dfbcfe5e69d945b5d86"

    # Shared secret: email + "HENNGECHALLENGE004" (raw ASCII bytes)
    secret_string = email + "HENNGECHALLENGE004"
    secret_bytes = secret_string.encode('ascii')

    # Generate the 10-digit TOTP password
    totp = generate_totp(secret_bytes)
    print(f"Generated TOTP: {totp}")

    # Build the JSON body
    body = {
        "github_url": github_url,
        "contact_email": email,
        "solution_language": "python"
    }
    data = json.dumps(body).encode('utf-8')
    print(f"Request body: {json.dumps(body, indent=2)}")

    # Build HTTP Basic Auth header: base64(email:totp)
    credentials = base64.b64encode(f"{email}:{totp}".encode('ascii')).decode('ascii')
    print(f"Authorization: Basic {credentials}")

    # Make the POST request
    url = "https://api.challenge.hennge.com/challenges/backend-recursion/004"
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Basic {credentials}')

    try:
        with urllib.request.urlopen(req) as response:
            print(f"\nSUCCESS! Status: {response.status}")
            print(f"Response: {response.read().decode('utf-8')}")
    except urllib.error.HTTPError as e:
        print(f"\nFAILED! HTTP Error: {e.code}")
        print(f"Response: {e.read().decode('utf-8')}")
        print("\nIf you got 401, the TOTP expired. Just re-run the script immediately.")
    except urllib.error.URLError as e:
        print(f"\nFAILED! Connection Error: {e.reason}")


if __name__ == "__main__":
    main()
