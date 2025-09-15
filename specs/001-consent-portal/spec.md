# Feature Specification: Academic Consent Portal

**Feature Branch**: `001-consent-portal`  
**Created**: 2024-12-15  
**Status**: Draft  
**Input**: User description: "I want to use react, typescript and supabase database. The project should handle consent for different case studies. There should be a uploaded pdf that users give their consent to. Bank id is the main feature that users are identified with. It is a consent portal for different academic studies"

## Execution Flow (main)
```
1. Parse user description from Input ✓
2. Extract key concepts from description ✓
   → Actors: researchers, study participants, administrators
   → Actions: authenticate, upload PDFs, give consent, manage studies
   → Data: user profiles, studies, PDF documents, consent records
   → Constraints: Bank ID authentication, academic compliance
3. Fill User Scenarios & Testing section ✓
4. Generate Functional Requirements ✓
5. Identify Key Entities ✓
6. Run Review Checklist
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story
A study participant receives an invitation to participate in an academic research study. They visit the consent portal, authenticate using Bank ID to verify their identity, review the study information and consent PDF document, and provide informed consent to participate. Researchers can then manage studies and track consent status.

### Acceptance Scenarios
1. **Given** a study participant has received a study invitation, **When** they visit the consent portal and authenticate with Bank ID, **Then** they can access the specific study information and consent form
2. **Given** a participant is viewing a study consent form, **When** they read the PDF document and click "I Consent", **Then** their consent is recorded with timestamp and Bank ID verification
3. **Given** a researcher has created a new study, **When** they upload a consent PDF and configure study details, **Then** participants can access the study and provide consent
4. **Given** an administrator is viewing the consent dashboard, **When** they select a study, **Then** they can see all participant consent records with verification status

### Edge Cases
- What happens when Bank ID authentication fails or is unavailable?
- How does the system handle expired or withdrawn consent?
- What occurs when a participant tries to consent multiple times to the same study?
- How are consent records maintained for audit and compliance purposes?

## Requirements

### Functional Requirements
- **FR-001**: System MUST authenticate users via Bank ID for identity verification
- **FR-002**: System MUST allow researchers to create and manage academic studies
- **FR-003**: System MUST allow researchers to upload PDF consent documents for each study
- **FR-004**: System MUST display study information and PDF consent forms to participants
- **FR-005**: System MUST record participant consent with Bank ID verification, timestamp, and study association
- **FR-006**: System MUST prevent duplicate consent from the same participant for the same study
- **FR-007**: System MUST allow participants to withdraw consent after initially providing it
- **FR-008**: System MUST maintain audit trail of all consent actions for compliance
- **FR-009**: System MUST allow administrators to view consent status across all studies
- **FR-010**: System MUST ensure data privacy and GDPR compliance for participant information
- **FR-011**: System MUST support multiple concurrent studies with separate consent tracking
- **FR-012**: System MUST validate PDF documents before allowing upload (file type, size limits)

### Key Entities
- **User**: Represents system users with roles (participant, researcher, administrator) and Bank ID authentication
- **Study**: Academic research study with title, description, researcher, status, and associated consent PDF
- **ConsentRecord**: Individual consent decision linking user, study, consent status, timestamp, and verification details
- **PDFDocument**: Uploaded consent forms with metadata, file storage reference, and validation status

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---