# BroComp Security Documentation

## Security Architecture Overview

BroComp implements a comprehensive, defense-in-depth security architecture designed to protect student data, prevent unauthorized access, and maintain system integrity.

---

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Input Validation & Sanitization](#input-validation--sanitization)
3. [Rate Limiting](#rate-limiting)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [File Upload Security](#file-upload-security)
6. [Audit Logging](#audit-logging)
7. [Multi-Factor Authentication (MFA)](#multi-factor-authentication-mfa)
8. [Security Best Practices](#security-best-practices)
9. [Incident Response](#incident-response)

---

## Authentication & Authorization

### User Roles

BroComp implements a three-tier role system:

- **Student** (default): Access to complaints, community chat, profile
- **Admin**: Complaint management, community moderation, user approval
- **Super Admin**: Full system access including user role management

### Role Storage

**CRITICAL**: Roles are stored in a separate `user_roles` table to prevent privilege escalation attacks. Never store roles in localStorage or client-side storage.

```sql
-- Roles table structure
CREATE TABLE user_roles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  role app_role NOT NULL
);
```

### Security Definer Functions

Role checks use security definer functions to prevent RLS recursion:

```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Password Requirements

- **Minimum length**: 12 characters
- **Complexity**: Must contain uppercase, lowercase, number, and special character
- **Leaked password protection**: Enabled (checks against known breached passwords)
- **Hashing**: bcrypt with automatic salting via Supabase Auth

---

## Input Validation & Sanitization

### Client-Side Validation (Zod)

All user inputs are validated using Zod schemas with strict rules:

```typescript
// Complaint validation example
const complaintSchema = z.object({
  subject: z.string()
    .trim()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-.,!?()]+$/, "Invalid characters")
    .refine((val) => !containsMaliciousContent(val)),
  description: z.string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters")
    .refine((val) => !containsMaliciousContent(val)),
});
```

### XSS Protection

All user-generated content is sanitized using DOMPurify:

```typescript
import DOMPurify from 'dompurify';

export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  }).trim();
};
```

### Malicious Content Detection

Pattern-based detection for common attack vectors:

- Script tags (`<script>`)
- JavaScript protocol (`javascript:`)
- Event handlers (`onclick=`, `onerror=`)
- iframes, objects, embeds

---

## Rate Limiting

### Client-Side Rate Limits

Implemented via localStorage tracking:

| Action | Limit | Duration |
|--------|-------|----------|
| Login attempts | 5 | 15 minutes |
| Registration | 3 | 1 hour |
| Complaint submission | 5 | 1 hour |
| Feedback submission | 3 | 1 hour |
| Chat messages | 60 | 1 minute |
| File uploads | 10 | 1 hour |

### Implementation

```typescript
const { checkRateLimit, incrementAttempts } = useRateLimit("complaint");

const rateCheck = checkRateLimit();
if (!rateCheck.allowed) {
  toast.error(`Please wait ${rateCheck.remainingTime} minutes`);
  return;
}

incrementAttempts();
// Proceed with action
```

---

## Row Level Security (RLS)

### Complaint Access

```sql
-- Students can only view their own complaints
CREATE POLICY "Users can view their own complaints" 
ON complaints FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints" 
ON complaints FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
```

### Chat Message Access

```sql
-- Only approved students can view chat messages
CREATE POLICY "Approved students can view messages" 
ON chat_messages FOR SELECT
USING (
  deleted_at IS NULL AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND admin_approved = true
  )
);
```

### Audit Log Access

```sql
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" 
ON audit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Prevent deletion of audit logs
CREATE POLICY "Prevent audit log deletion" 
ON audit_logs FOR DELETE
USING (false);
```

---

## File Upload Security

### Allowed File Types

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF
- Office: Word (DOC, DOCX), Excel (XLS, XLSX)

### Validation Layers

1. **Client-side MIME type check**
2. **File size limit**: 5MB maximum
3. **Server-side magic number validation** (via Edge Function)
4. **Filename sanitization** (removes path traversal characters)
5. **Rate limiting**: 10 uploads per hour

### Magic Number Validation

```typescript
const FILE_SIGNATURES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};
```

### Filename Sanitization

```typescript
export const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 255);
};
```

---

## Audit Logging

### Logged Events

All security-relevant actions are logged to `audit_logs` table:

- User role changes
- Profile approvals/rejections
- Complaint status changes
- File uploads
- Authentication events (MFA enable/disable)
- Admin actions

### Log Structure

```typescript
interface AuditLog {
  id: uuid;
  user_id: uuid;
  action: string;
  resource_type: string;
  resource_id?: uuid;
  ip_address?: inet;
  user_agent?: string;
  metadata?: jsonb;
  created_at: timestamp;
}
```

### Accessing Logs

Audit logs are accessible through the Admin Security Dashboard at `/admin/security`.

---

## Multi-Factor Authentication (MFA)

### TOTP Implementation

BroComp supports Time-Based One-Time Password (TOTP) authentication:

- Compatible with Google Authenticator, Authy, 1Password, etc.
- 6-digit codes rotating every 30 seconds
- QR code enrollment for easy setup
- Manual key entry option available

### Enrollment Process

1. Admin navigates to Security settings
2. Clicks "Enable MFA"
3. Scans QR code with authenticator app
4. Enters verification code to confirm
5. MFA is now required for all future logins

### MFA Enforcement

**Recommendation**: Enable MFA for all admin and super_admin accounts.

---

## Security Best Practices

### For Administrators

1. **Enable MFA immediately** after gaining admin access
2. **Use strong, unique passwords** (12+ characters, mixed case, numbers, symbols)
3. **Review audit logs regularly** for suspicious activity
4. **Approve student registrations carefully** - verify email domains
5. **Monitor rate limit violations** for potential abuse
6. **Keep credentials confidential** - never share admin accounts

### For Developers

1. **Never bypass RLS policies** - always use proper authentication checks
2. **Validate all inputs** both client-side and server-side
3. **Sanitize user content** before rendering or storing
4. **Log security events** for all critical actions
5. **Use parameterized queries** - never construct SQL with string concatenation
6. **Keep dependencies updated** - regularly check for security patches
7. **Test with different user roles** - ensure proper access control

### For Students

1. **Use a strong password** meeting the complexity requirements
2. **Keep your account secure** - don't share credentials
3. **Report suspicious activity** to administrators
4. **Verify you're on the correct domain** before logging in

---

## Incident Response

### Security Event Classification

- **Critical**: Data breach, privilege escalation, authentication bypass
- **High**: Repeated failed login attempts, suspicious file uploads
- **Medium**: Rate limit violations, unusual access patterns
- **Low**: Informational events, routine access

### Response Procedure

1. **Detection**: Security events trigger audit log entries
2. **Assessment**: Admin reviews event in Security Dashboard
3. **Containment**: If malicious, disable affected user accounts
4. **Investigation**: Review audit logs for related activity
5. **Remediation**: Apply fixes, update security policies if needed
6. **Documentation**: Record incident details and actions taken

### Contact Information

For security concerns, contact the development team or super admin immediately.

---

## Security Checklist

### Pre-Deployment

- [ ] All RLS policies tested and verified
- [ ] Rate limiting configured and tested
- [ ] Input validation covers all forms
- [ ] File upload restrictions enforced
- [ ] Audit logging enabled for all critical actions
- [ ] Password requirements enforced
- [ ] Leaked password protection enabled
- [ ] MFA available for admin accounts

### Post-Deployment

- [ ] Monitor audit logs daily
- [ ] Review failed authentication attempts weekly
- [ ] Check for unusual file upload activity
- [ ] Verify rate limit effectiveness
- [ ] Update dependencies monthly
- [ ] Conduct security reviews quarterly

---

## Testing Security

### Manual Security Tests

1. **SQL Injection**: Attempt SQL in all input fields
2. **XSS**: Submit `<script>alert('xss')</script>` in text areas
3. **Authentication Bypass**: Try accessing admin pages without login
4. **Authorization Bypass**: Try accessing other users' data
5. **CSRF**: Test form submissions from external sites
6. **File Upload**: Attempt to upload executable files
7. **Rate Limiting**: Exceed rate limits and verify blocking

### Automated Security Scanning

Consider integrating:
- **OWASP ZAP** for vulnerability scanning
- **npm audit** for dependency vulnerabilities
- **Snyk** for continuous security monitoring

---

## Version History

- **v1.0** (2025-01-19): Initial security implementation
  - Rate limiting, input validation, RLS policies
  - Audit logging, file upload security
  - MFA support, security dashboard

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Web Security Guidelines](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**Document Maintained By**: BroComp Development Team  
**Last Updated**: 2025-01-19  
**Classification**: Internal Use Only
