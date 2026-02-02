# Harvesters Small Groups CRM - Project Context

## Project Vision

Harvesters Small Groups CRM is a centralized, data-driven web application built exclusively for Harvesters International Christian Centre. The platform enables effective management of small group meetings, tracks member engagement, and supports pastoral care through structured insights, accountability, and informed decision-making. 

Founded on December 13th, 2003, by Pastor Bolaji Idowu, Harvesters has grown from a handful of people to over 70,000 worshippers across multiple locations in Nigeria, the United Kingdom, and the United States of America. This platform supports Harvesters' vision of changing lives by pioneering thriving churches in key global cities that bring hope, connect people with God, influence culture, and lead people to become fully devoted followers of Christ.

The platform provides visibility into member participation, group health, and leadership effectiveness while remaining simple, respectful of privacy, and aligned with Harvesters' operations and values.

## Core Features

### 1. User Management & Access Control

- **Three-Tier Role System**: Superadmin (church leadership), Group Leader (fellowship leaders), Member (regular attendees)
- **Profile Management**: Comprehensive member profiles with demographics, interests, and contact info
- **Role Assignment**: Dynamic role assignment and management by superadmins
- **User Directory**: Centralized directory with search and filtering capabilities

### 2. Group & Fellowship Management

- **Group Creation**: Superadmins and leaders can create and manage groups
- **Member Assignment**: Flexible member-group associations
- **Group Metadata**: Name, description, meeting frequency, assigned leaders
- **Group Performance**: Dashboard showing health metrics and engagement

### 3. Meeting & Attendance Tracking

- **Biweekly Scheduling**: Default meeting frequency with customization
- **Manual Logging**: Leaders log meetings with date, time, duration
- **Attendance Capture**: Numeric count or member-by-member checkbox
- **Screenshot Upload**: WhatsApp call screenshots or other proof of meeting
- **Attendance History**: Comprehensive tracking of member participation

### 4. Communication & Pastoral Care

- **Interaction Logging**: Track calls, follow-ups, and check-ins
- **Timestamped Records**: Complete history of leader-member interactions
- **Follow-up Reminders**: Automated prompts for inactive member outreach
- **Interaction Analytics**: Frequency and effectiveness metrics

### 5. Membership Requests & Transfers

- **Join Requests**: Members can request to join specific groups
- **Transfer Requests**: Members can request to change groups
- **Leader Approval**: Group leaders approve or reject requests
- **Transfer History**: Complete audit trail of member movements
- **Superadmin Override**: Church leadership can reassign as needed

### 6. Engagement Metrics & Analytics

- **Member-Level Metrics**: Attendance percentage, participation history, engagement scoring
- **Group-Level Metrics**: Group attendance, meeting frequency adherence, comparative performance
- **Church-Wide Dashboard**: Overall engagement, trend analysis, at-risk identification
- **Exportable Reports**: CSV/PDF exports for leadership review

### 7. Interest-Based Insights

- **Interest Tagging**: Members select interests during onboarding
- **Interest-Based Filtering**: Find members with similar interests
- **Group Recommendations**: Suggest optimal groups based on interests and demographics
- **Fellowship Alignment**: Data-driven member grouping for better engagement

## Technical Architecture

### Frontend Stack

- **Next.js 15+**: App Router for modern React patterns
- **TypeScript**: Strict mode for type safety
- **Ant Design**: Comprehensive UI component library
- **Tailwind CSS**: Utility-first styling for customization
- **React Context**: Global state management for auth and user role

### Authentication & Authorization

- **JWT Tokens**: Access and refresh token pattern
- **httpOnly Cookies**: Secure token storage
- **Token Refresh**: Automatic renewal before expiration
- **Role-Based Access Control**: Enforced at middleware, API, and UI levels
- **Protected Routes**: Route guards based on user role

### State Management

- **AuthContext**: User authentication state and role information
- **Server State**: Server Components for data fetching
- **Server Actions**: Mutations and form submissions
- **Local State**: Component-level state with hooks

### PWA Features

- **Offline Support**: Service workers for basic offline functionality
- **Installable**: Add to home screen on mobile devices
- **Push Notifications**: Meeting reminders and updates
- **Responsive Design**: Mobile-first approach

### Data Flow

```
User Action → Server Action/API Route → Mock DB/Prisma → Response
           ↓
    Update UI (optimistic) → Revalidate → Final State
```

## Mock Backend Structure (Phases 3-4)

### TypeScript Mock Database

```typescript
// lib/data/mockData.ts
const users: User[] = [...];
const groups: Group[] = [...];
const meetings: Meeting[] = [...];
const interactions: Interaction[] = [...];
const membershipRequests: MembershipRequest[] = [...];
const notifications: Notification[] = [...];
```

### In-Memory Database Service

```typescript
// lib/data/database.ts
export const db = {
  users: {
    find: (id: string) => User | undefined,
    findMany: (filter?) => User[],
    create: (data) => User,
    update: (id, data) => User,
    delete: (id) => void,
  },
  groups: { /* similar CRUD operations */ },
  meetings: { /* similar CRUD operations */ },
  // ... other resources
};
```

### Next.js API Routes

All endpoints in `/app/api/` directory:

- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Groups: `/api/groups/*`
- Meetings: `/api/meetings/*`
- Interactions: `/api/interactions/*`
- Membership Requests: `/api/membership-requests/*`
- Analytics: `/api/analytics/*`

## Production Database Architecture (Phase 15)

### Database Stack

- **ORM**: Prisma (v5.x)
- **Database**: PostgreSQL (14+)
- **Caching**: Redis (Upstash)
- **File Storage**: Cloudinary

### Database Models

#### User Model

- **Fields**: id, email (unique), password (bcrypt), firstName, lastName, phone, whatsappPhone, location, age, maritalStatus, employmentStatus, interests[], role (enum), groupId, avatar (Cloudinary URL), isActive, createdAt, updatedAt
- **Relations**: group (n:1), ledGroups (1:n), meetings (1:n via group), interactions (1:n as recipient)
- **Indexes**: email, role, groupId, isActive

#### Group Model

- **Fields**: id, name, description, meetingFrequency, leaderId, createdAt, updatedAt
- **Relations**: leader (n:1 with User), members (1:n), meetings (1:n)
- **Indexes**: leaderId, createdAt

#### Meeting Model

- **Fields**: id, groupId, date, startTime, endTime, attendeeCount, attendeeIds[], screenshotUrl (Cloudinary), notes, createdById, createdAt, updatedAt
- **Relations**: group (n:1), createdBy (n:1 with User), attendance (1:n)
- **Indexes**: groupId, date (DESC), createdById

#### Attendance Model

- **Fields**: id, meetingId, memberId, present (boolean), createdAt
- **Relations**: meeting (n:1), member (n:1 with User)
- **Unique**: [meetingId, memberId]
- **Indexes**: meetingId, memberId

#### Interaction Model

- **Fields**: id, leaderId, memberId, type (CALL/FOLLOW_UP/CHECK_IN), notes, timestamp, createdAt
- **Relations**: leader (n:1 with User), member (n:1 with User)
- **Indexes**: leaderId, memberId, type, timestamp (DESC)

#### MembershipRequest Model

- **Fields**: id, memberId, fromGroupId, toGroupId, type (JOIN/TRANSFER), status (PENDING/APPROVED/REJECTED), requestedAt, respondedAt, respondedById
- **Relations**: member (n:1 with User), fromGroup (n:1), toGroup (n:1), respondedBy (n:1 with User)
- **Indexes**: memberId, status, requestedAt (DESC)

#### Notification Model

- **Fields**: id, userId, type (MEETING_REMINDER/REQUEST_STATUS/ROLE_ASSIGNMENT), title, message, relatedId, read, createdAt
- **Relations**: user (n:1)
- **Indexes**: [userId, read], createdAt (DESC)

### Analytics & Algorithms

#### Member Engagement Scoring

```typescript
score =
  attendanceRate * 0.5 +
  interactionFrequency * 0.3 +
  daysActiveMembership * 0.2;
```

#### At-Risk Member Identification

- No attendance in last 3 meetings
- No leader interactions in last 30 days
- Engagement score below threshold (< 40)

#### Group Health Metrics

- Average attendance percentage
- Meeting frequency adherence
- Member retention rate
- Leader interaction frequency
- Response time to membership requests

#### Church-Wide Analytics

- Total active members vs inactive
- Overall attendance trends
- Group performance comparison
- Interest distribution analysis
- Leadership effectiveness metrics

### Caching Strategy

#### Cache Keys

- User profile: `user:{userId}`
- Group members: `group:{groupId}:members`
- Group meetings: `group:{groupId}:meetings`
- Member analytics: `analytics:member:{userId}`
- Group analytics: `analytics:group:{groupId}`
- Church-wide metrics: `analytics:church`

#### Cache TTLs

- User profiles: 15 minutes
- Group data: 10 minutes
- Meeting lists: 5 minutes
- Analytics: 30 minutes

#### Invalidation Rules

- On profile update: Clear user cache
- On member join/leave: Clear group members cache
- On meeting creation: Clear group meetings cache
- On attendance update: Clear all related analytics caches
- On interaction log: Clear member analytics cache

### Rate Limiting

#### IP-based (Unauthenticated)

- 100 requests per minute
- Applied to login, registration endpoints

#### User-based (Authenticated)

- 300 requests per minute (general)
- 10 meeting creations per hour
- 30 interaction logs per hour
- 20 membership requests per day

#### Implementation

- Redis-based sliding window
- Returns 429 with Retry-After header
- Separate limits per endpoint category

### Image Management

#### Cloudinary Integration

- **Upload Folders**: `church-crm/avatars`, `church-crm/meetings`
- **Transformations**:
  - Avatars: 300×300, crop fill, face gravity, auto quality
  - Meeting screenshots: 800px width, auto quality, auto format
- **Allowed Formats**: jpg, png, webp
- **Max File Size**: 5MB
- **Security**: Signed uploads, restricted folders

#### Image Operations

- Upload: Validate → Convert to base64 → Cloudinary → Store URL
- Update: Delete old → Upload new → Update record
- Delete: Extract public ID → Cloudinary destroy
- Validation: Client-side (type, size) + server-side

### Security Best Practices

- **Password Hashing**: bcrypt with 12 salt rounds
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Prevention**: Sanitize user-generated content
- **CSRF Protection**: SameSite cookies, token verification
- **Rate Limiting**: All endpoints protected
- **Audit Logs**: Track sensitive operations (role changes, member transfers)
- **Data Access Control**: Role-based filtering at query level

### Performance Optimizations

#### Database

- Indexes on frequently queried fields
- Composite indexes for complex queries
- Connection pooling (Prisma default)
- Select only needed fields
- Batch operations where possible
- Cursor-based pagination

#### Caching

- Redis for frequently accessed data
- Cache-aside pattern
- Invalidate on writes
- Short TTLs for balance

#### API Response

- Gzip compression
- Minimal payloads
- Paginated results (20 items default)
- HTTP caching headers

## Design System

### Color Palette

- **Primary**: `#1B4B3E` (Deep Church Green)
- **Secondary**: `#8B7355` (Warm Brown)
- **Accent**: `#D4A373` (Golden Accent)
- **Success**: `#52c41a` (Ant Design default)
- **Warning**: `#faad14` (Ant Design default)
- **Error**: `#ff4d4f` (Ant Design default)
- **Neutrals**: Gray scale from 50-900
- **Base**: White `#ffffff`, Dark `#141414`

### Typography

- **Primary Font**: Inter
- **Fallbacks**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Scale**: Ant Design default scale

### Spacing

- Consistent use of Tailwind spacing utilities
- 4px base unit (Tailwind default)

### Components

- Ant Design components as foundation
- Custom styling with Tailwind
- Consistent border radius (6px)
- Subtle shadows for elevation
- Smooth transitions (200ms)

## User Flows

### Member Registration Flow

1. User enters personal details (name, email, phone)
2. Selects demographic info (age, marital status, employment)
3. Chooses interests from predefined list
4. Optionally selects a group to join
5. Account created with Member role
6. Email verification (optional)
7. Redirect to member dashboard

### Group Leader Meeting Creation Flow

1. Leader navigates to "Create Meeting" in their group
2. Fills in date, start time, end time
3. Optionally adds meeting notes
4. Uploads screenshot of meeting call (if available)
5. Selects attendance tracking method (count or checklist)
6. If checklist: marks present/absent for each member
7. If count: enters total number of attendees
8. Submits meeting record
9. Meeting appears in group history

### Membership Request Flow

1. Member browses available groups
2. Clicks "Request to Join" on desired group
3. Optionally adds message explaining request
4. Request sent to group leader
5. Leader receives notification
6. Leader reviews member profile and request
7. Leader approves or rejects with optional message
8. Member receives notification of decision
9. If approved: member moved to new group
10. If rejected: can request different group

### Superadmin Group Analytics Flow

1. Superadmin navigates to Analytics dashboard
2. Views church-wide overview (total groups, members, meetings)
3. Selects specific group for detailed analysis
4. Reviews attendance trends (chart over time)
5. Identifies at-risk members (low engagement)
6. Views leader interaction frequency
7. Compares group performance against church average
8. Exports report as CSV or PDF for leadership meeting

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user, return tokens
- `POST /api/auth/logout` - Invalidate refresh token
- `POST /api/auth/refresh-token` - Get new access token

### Users

- `GET /api/users` - List users (superadmin only, paginated)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Deactivate user (superadmin)
- `PUT /api/users/:id/role` - Change user role (superadmin)

### Groups

- `GET /api/groups` - List groups (role-filtered)
- `GET /api/groups/:id` - Get group details
- `POST /api/groups` - Create group (superadmin/leader)
- `PUT /api/groups/:id` - Update group info
- `DELETE /api/groups/:id` - Delete group (superadmin)
- `GET /api/groups/:id/members` - List group members
- `POST /api/groups/:id/members` - Add member to group
- `DELETE /api/groups/:id/members/:memberId` - Remove member

### Meetings

- `GET /api/meetings` - List meetings (role-filtered, paginated)
- `GET /api/meetings/:id` - Get meeting details
- `POST /api/meetings` - Create meeting (leader)
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting (leader/superadmin)
- `POST /api/meetings/:id/attendance` - Log attendance

### Interactions

- `GET /api/interactions` - List interactions (role-filtered)
- `POST /api/interactions` - Log interaction (leader)
- `PUT /api/interactions/:id` - Update interaction
- `DELETE /api/interactions/:id` - Delete interaction

### Membership Requests

- `GET /api/membership-requests` - List requests (role-filtered)
- `POST /api/membership-requests` - Create request (member)
- `PUT /api/membership-requests/:id/approve` - Approve request (leader)
- `PUT /api/membership-requests/:id/reject` - Reject request (leader)

### Analytics

- `GET /api/analytics/member/:id` - Member engagement metrics
- `GET /api/analytics/group/:id` - Group performance metrics
- `GET /api/analytics/church` - Church-wide analytics (superadmin)
- `GET /api/analytics/export` - Export analytics report

## Role-Based Access Matrix

| Feature               | Member   | Leader        | Superadmin |
| --------------------- | -------- | ------------- | ---------- |
| View own profile      | ✅       | ✅            | ✅         |
| Edit own profile      | ✅       | ✅            | ✅         |
| View own group        | ✅       | ✅            | ✅         |
| View all groups       | ❌       | ❌            | ✅         |
| Create group          | ❌       | Limited       | ✅         |
| Edit group            | ❌       | Own group     | ✅         |
| Delete group          | ❌       | ❌            | ✅         |
| Create meeting        | ❌       | Own group     | ✅         |
| Log attendance        | ❌       | Own group     | ✅         |
| Log interactions      | ❌       | Own group     | ✅         |
| Request membership    | ✅       | ✅            | N/A        |
| Approve requests      | ❌       | Own group     | ✅         |
| View member analytics | Own only | Group members | All        |
| View group analytics  | Own only | Own group     | All        |
| View church analytics | ❌       | ❌            | ✅         |
| Assign roles          | ❌       | ❌            | ✅         |
| Manage users          | ❌       | ❌            | ✅         |

## Data Privacy & Compliance

- Members can only view their own detailed data
- Leaders can only access data for their group members
- Superadmins have full access but are church-trusted leadership
- Personal information (phone numbers, addresses) is protected
- Audit logs track all sensitive operations
- Data export capabilities for members to request their data
- Secure deletion process for account removal
- No third-party data sharing without explicit consent

## Success Metrics

- **Adoption Rate**: Percentage of church members using the system
- **Active Groups**: Number of groups with regular meetings
- **Meeting Consistency**: Percentage of groups meeting at scheduled frequency
- **Attendance Tracking**: Percentage of meetings with logged attendance
- **Member Engagement**: Average attendance rate across all members
- **Leader Adoption**: Percentage of leaders actively logging activities
- **At-Risk Identification**: Number of inactive members identified and re-engaged
- **Request Response Time**: Average time to approve/reject membership requests
- **System Uptime**: Target 99.5% availability
- **Mobile Usage**: Percentage of access from mobile devices

## Future Enhancements (Out of Scope for MVP)

- Built-in messaging between leaders and members
- Video calling integration
- Financial contribution tracking
- Event management beyond regular meetings
- AI-driven insights and recommendations
- Multi-church support with shared resources
- Mobile native apps (iOS/Android)
- Advanced prayer request management
- Volunteer scheduling and management
- Resource library and document sharing
