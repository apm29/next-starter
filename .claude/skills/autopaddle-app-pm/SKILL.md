---
name: autopaddle-app-pm
description: AutoPaddle application product manager for requirement gathering and clarification. Acts as PM to analyze user needs, define application scope, specify data sources, and create structured requirement documents. Use when starting new AutoPaddle app development, clarifying vague requirements, or planning application features before implementation. This skill MUST be called by autopaddle-nextjs-builder before any implementation begins.
---

# AutoPaddle Application Product Manager

Gather, analyze, and clarify requirements for AutoPaddle Next.js applications before implementation.

## Role & Responsibilities

As the AutoPaddle Application Product Manager, this skill:

- 📋 **Requirement Analysis** - Understand user needs and translate them into technical specifications
- 🎯 **Scope Definition** - Define clear application boundaries and deliverables
- 📊 **Data Source Planning** - Identify required APIs and data sources (within platform constraints)
- 🎨 **UX Requirements** - Specify user experience expectations and constraints
- ✅ **Feature Checklist** - Create actionable feature lists for developers
- 🔌 **API Constraint Awareness** - Ensure requirements align with available AutoPaddle APIs and InfluxDB capabilities

## When to Use This Skill

**MANDATORY for autopaddle-nextjs-builder:**
- Before any AutoPaddle app implementation begins
- When user requirements are vague or incomplete
- When planning new features or pages

**Optional standalone use:**
- Planning AutoPaddle application architecture
- Evaluating feasibility of feature requests
- Creating technical specifications for stakeholders

## Platform Technical Constraints 🔌

**CRITICAL**: As a PM, you MUST understand and work within AutoPaddle platform's technical capabilities. All requirements must align with available APIs and data sources.

### AutoPaddle Cloud API Constraints

**Authentication Requirements:**
- All API calls MUST include headers:
  - `Authorization: Bearer ${accessToken}`
  - `Tenant-ID: ${tenantId}`
- Handle 401 responses by refreshing tokens automatically
- Response format: `{code: 0, data: {...}, msg: ""}`

**Available API Categories:**
- Device Management APIs (device list, device info, device pins)
- Device Daily Report APIs (device daily production info)
- Alarm System APIs (alarm records, alarm statistics)
- Business Data APIs (custom business metrics)
- User Management APIs (user info, permissions)

**PM Consideration**:
- Verify required APIs exist in `skill:autopaddle-api-explorer` before committing to features
- Plan for token refresh logic in all data-fetching scenarios
- Design error handling for API failures

### InfluxDB Time-Series Data Constraints

**Query Constraints:**
- Time-series data only (device pins, sensor readings, metrics over time)
- Requires Flux query language knowledge
- Session-based query pattern for complex queries:
  1. Initiate query with sessionId
  2. Poll for results using sessionId
  3. Parse returned data

**PM Consideration**:
- Historical data queries are suitable for trends, charts, and analytics
- Real-time data requires polling or WebSocket implementation
- Complex aggregations may need session-based queries
- Verify measurement and field names exist before planning features

### Data Query Patterns

**Session-Based Query Workflow:**
1. **Initiate**: POST request with query parameters, receive sessionId
2. **Poll**: GET request with sessionId to check status
3. **Retrieve**: Parse data when status is "completed"

**PM Consideration**:
- Plan for loading states during query execution
- Design UX for long-running queries (progress indicators)
- Consider caching strategies for frequently accessed data

### Technical Feasibility Checklist

Before finalizing requirements, verify:

- [ ] All required APIs are documented in `references/api-reference.md`
- [ ] InfluxDB measurements/fields are available (check `references/influxdb-guide.md`)
- [ ] Data query patterns are supported (check `references/data-query-patterns.md`)
- [ ] Authentication flow is understood (token refresh, error handling)
- [ ] Time-series data requirements align with InfluxDB capabilities
- [ ] Real-time update requirements are achievable (polling intervals, WebSocket support)

### Common Technical Limitations

**What AutoPaddle Platform CAN do:**
✅ Fetch device lists and device information
✅ Query historical time-series data (device pins, sensors)
✅ Retrieve alarm records with pagination
✅ Access business data metrics
✅ Authenticate with tenant-specific tokens

**What AutoPaddle Platform CANNOT do (without custom implementation):**
❌ Direct database writes (read-only access)
❌ Real-time push notifications (requires polling or WebSocket setup)
❌ Cross-tenant data access (tenant isolation enforced)
❌ Arbitrary SQL queries (InfluxDB uses Flux query language)
❌ File uploads/downloads (unless API specifically supports it)

**PM Responsibility**:
- Clarify technical feasibility BEFORE committing to features
- Propose alternative solutions if requested feature exceeds platform capabilities
- Document technical constraints in requirement specification

## Requirement Gathering Process

### Step 1: Understand User Intent

Ask clarifying questions about:

1. **Application Type**
   - Dashboard? Monitoring tool? Reporting system? Configuration interface?
   - Who are the end users? (Operators, managers, technicians, etc.)
   - What problem does this solve?

2. **Core Functionality**
   - What are the main tasks users need to accomplish?
   - What decisions will users make with this data?
   - Are there any critical workflows to support?

3. **Data Requirements**
   - What devices/equipment need to be monitored?
   - What metrics or KPIs are important?
   - Historical data or real-time only?
   - Any specific time ranges or aggregations?
   - **Verify against platform constraints**: Check if required data is available via AutoPaddle APIs or InfluxDB

### Step 2: Define Application Scope

Create a structured specification including:

**Application Overview:**
- Application name and purpose
- Target users and use cases
- Success criteria

**Page Structure:**
- List of pages/routes needed
- Purpose of each page
- Navigation flow between pages

**Data Sources:**
- AutoPaddle Cloud APIs needed (devices, alarms, business data, etc.)
  - **Verify**: Check `references/api-reference.md` for API availability
  - **Note**: All APIs require `Authorization` and `Tenant-ID` headers
- InfluxDB measurements and fields required
  - **Verify**: Check `references/influxdb-guide.md` for measurement/field availability
  - **Note**: Connection to `http://${GATEWAY_IP}:18086` with org `autopaddle`
- Any external data sources
  - **Constraint**: May require custom implementation if not in platform

**Feature Requirements:**
- Core features (must-have)
- Secondary features (nice-to-have)
- Future considerations (out of scope for now)

### Step 3: Specify UX Requirements

Define user experience expectations:

**Data Presentation:**
- Tables, charts, cards, or other visualizations?
- Filtering and search capabilities
- Sorting and pagination needs

**Interaction Patterns:**
- Real-time updates vs. manual refresh
- Drill-down or detail views
- Export or reporting capabilities

**UX Best Practices:**
- Use dropdowns instead of raw ID inputs
- Display names instead of IDs (with proper mapping)
- Format timestamps with dayjs or similar
- Show loading states and error messages
- Provide data completeness in dropdowns

### Step 4: Create Deliverable Document

Generate a structured requirement document:

```markdown
# AutoPaddle Application Requirements

## Application Overview
- **Name**: [Application Name]
- **Type**: [Dashboard/Monitoring/Reporting/etc.]
- **Purpose**: [Brief description]
- **Users**: [Target audience]

## Pages & Components

### Page 1: [Page Name]
- **Route**: /[route-name]
- **Purpose**: [What this page does]
- **Data Sources**:
  - AutoPaddle API: [specific endpoints]
  - InfluxDB: [measurements/fields]
- **Features**:
  - [ ] Feature 1
  - [ ] Feature 2
- **UX Requirements**:
  - Requirement 1
  - Requirement 2

### Page 2: [Page Name]
[Repeat structure]

## Data Integration

### AutoPaddle Cloud APIs
- Device Management: [Yes/No - which endpoints]
- Alarm System: [Yes/No - which endpoints]
- Business Data: [Yes/No - which endpoints]
- User Management: [Yes/No - which endpoints]

### InfluxDB Queries
- Measurement: [measurement name]
- Fields: [field1, field2, ...]
- Time Range: [e.g., last 24 hours, custom range]
- Aggregation: [e.g., mean, sum, last]

## Feature Checklist

### Core Features (Must Have)
- [ ] Feature 1
- [ ] Feature 2

### Secondary Features (Nice to Have)
- [ ] Feature 3
- [ ] Feature 4

### Future Considerations (Out of Scope)
- Feature 5
- Feature 6

## UX Requirements

### Data Display
- Use dropdowns for all selection inputs
- Display entity names (not IDs) throughout UI
- Format all timestamps using dayjs
- Show loading states during data fetching
- Display meaningful error messages

### Interaction
- [Specific interaction requirements]

### Performance
- [Any performance expectations]

## Technical Constraints
- [Any known limitations or constraints]

## Success Criteria
- [How to measure if this app is successful]
```

## Output Format

The PM skill should provide:

✅ **Structured Requirements Document** - Clear, actionable specification
✅ **Page/Component Breakdown** - Detailed list of what to build
✅ **Data Source Mapping** - Specific APIs and queries needed
✅ **Feature Prioritization** - Must-have vs. nice-to-have
✅ **UX Guidelines** - Specific user experience requirements
✅ **Success Criteria** - How to validate the implementation

## Integration with Builder Skill

**Handoff to autopaddle-nextjs-builder:**

After PM skill completes requirement gathering:
1. Builder skill receives structured requirements document
2. Builder implements according to specification
3. Builder refers back to requirements during development
4. Builder validates implementation against feature checklist

**Communication Protocol:**

```markdown
PM Skill Output → Builder Skill Input

Requirements Document serves as:
- Implementation specification
- Feature checklist
- Data source reference
- UX validation criteria
```

## Example Workflow

### User Request
"I need an app to monitor device temperatures and show alarms"

### PM Skill Questions
1. How many devices? All devices or specific ones?
2. Real-time temperature or historical trends?
3. What time ranges for historical data?
4. What alarm information? (count, list, details?)
5. Any filtering or search needed?
6. Export capabilities required?

### PM Skill Output
```markdown
# Device Temperature Monitoring Dashboard

## Application Overview
- **Name**: Temperature Monitor
- **Type**: Real-time Monitoring Dashboard
- **Purpose**: Monitor device temperatures and track alarms
- **Users**: Operations team

## Pages

### Page 1: Device Temperature Overview
- **Route**: /dashboard
- **Data Sources**:
  - AutoPaddle API: GET /device/device/list
  - InfluxDB: measurement=device_pins, field=temperature
- **Features**:
  - [ ] Real-time temperature display for all devices
  - [ ] Temperature trend charts (last 24 hours)
  - [ ] Device filtering by name/location
  - [ ] Temperature threshold indicators
- **UX Requirements**:
  - Use device name dropdown (not ID input)
  - Format timestamps with dayjs
  - Show temperature unit (°C)
  - Color-code by threshold (green/yellow/red)

### Page 2: Alarm History
- **Route**: /alarms
- **Data Sources**:
  - AutoPaddle API: GET /device/alarm-record/page
- **Features**:
  - [ ] Paginated alarm list
  - [ ] Filter by device, severity, time range
  - [ ] Alarm detail view
  - [ ] Export to CSV
- **UX Requirements**:
  - Device dropdown with all devices
  - Severity dropdown (Critical/High/Medium/Low)
  - Date range picker for time filtering
  - Format alarm timestamps

## Data Integration
- Device List API: Populate device dropdown
- InfluxDB: Query temperature data every 5 seconds
- Alarm API: Fetch with pagination (20 per page)

## Feature Checklist
### Core Features
- [ ] Real-time temperature display
- [ ] Temperature trend charts
- [ ] Alarm list with pagination
- [ ] Device and time filtering

### Secondary Features
- [ ] Export alarm data
- [ ] Temperature threshold configuration
- [ ] Email notifications

## Success Criteria
- All devices show current temperature within 5 seconds
- Historical data loads within 2 seconds
- Alarms update in real-time
- No raw IDs visible to users
```

## Quality Assurance

**Before handoff to builder:**
- [ ] All user questions answered
- [ ] Data sources clearly identified **and verified against platform constraints**
- [ ] Features prioritized (must-have vs. nice-to-have)
- [ ] UX requirements specified
- [ ] Technical feasibility confirmed **using Platform Technical Constraints checklist**

**Validation checklist:**
- [ ] Requirements are specific and actionable
- [ ] No ambiguous terms or vague descriptions
- [ ] All data sources are available in AutoPaddle platform **✓ Verified in references**
- [ ] UX requirements follow AutoPaddle best practices
- [ ] Success criteria are measurable
- [ ] **API authentication requirements understood** (Bearer token + Tenant-ID)
- [ ] **Token refresh logic planned** for 401 error handling
- [ ] **InfluxDB connection parameters documented** (URL, org, bucket, token)
- [ ] **Query patterns identified** (direct API vs. session-based queries)

## Common Pitfalls to Avoid

❌ **Vague requirements** - "Make it look nice"
✅ **Specific requirements** - "Use card layout with device name, current value, and trend sparkline"

❌ **Missing data sources** - "Show device data"
✅ **Specific data sources** - "GET /device/device/list for device info, InfluxDB device_pins measurement for pin values"

❌ **Unclear scope** - "Add some charts"
✅ **Clear scope** - "Line chart for temperature trend (last 24h), bar chart for alarm count by severity"

❌ **No prioritization** - "Need all these features"
✅ **Prioritized features** - "Core: device list, temperature display; Secondary: export, notifications"

## References

For implementation details, the builder skill will reference:
- `references/api-reference.md` - AutoPaddle API specifications
- `references/influxdb-guide.md` - InfluxDB connection and query patterns
- `references/data-query-patterns.md` - Common data query workflows

---

## Summary

The AutoPaddle App PM skill ensures that:
1. 🎯 Requirements are clear and actionable before implementation
2. 📊 Data sources are identified and validated **against platform capabilities**
3. 🎨 UX expectations are explicitly defined
4. ✅ Features are prioritized and scoped appropriately
5. 🤝 Smooth handoff to builder skill with complete specification
6. 🔌 **All requirements align with AutoPaddle platform technical constraints**
7. 🔐 **Authentication and data access patterns are properly planned**

**Remember**: Good requirements gathering prevents wasted development effort and ensures the final application meets user needs **within platform capabilities**.
