Product Requirement Document (PRD)
Document Overview
? Project Title: Service Marketplace Infrastructure Expansion
? Author: Product Management
? Target Audience: Engineering, QA, System Architects, and UI/UX Designers
? Objective: Upgrade the existing product-based marketplace architecture to support
both Digital Services (files, consultations) and Physical/On-Site Services (local
trade, logistics, styling).
1. System Overview & Core Architecture Change
The existing platform operates on an Add to Cart ? Checkout ? Ship Product logic.
The updated platform must introduce a parallel architecture: Add Service ? Configure
Tiers ? Checkout ? Secure Escrow ? Gather Requirements ? Start Fulfillment
Clock ? Milestones/Delivery ? Release Escrow.
[Seller Lists Service] ??> [Buyer Orders & Pays] ??> [Escrow Holds Funds]
?
[Seller Delivers Work] <?? [Clock Starts] <?? [Buyer Submits Requirements]
?
[Buyer Approves / Auto-Approve] ??> [Funds Released to Seller]
2. Epic 1: The Multi-Step "Add Service" Listing Wizard
Functional Requirements
The listing page must be converted into a multi-step form wizard that saves progress as
drafts database-side on each step validation.
Step 1: Basic Metadata & Service Type Selection
? Service Title: Text input, max 80 characters. Pre-validated text constraint: Must
begin with or naturally contain active verb phrasing (e.g., "I will...").
? Category & Subcategory Dropdowns: Parent-child relational pickers. Selecting a
category triggers a conditional UI rendering layout engine for the remaining steps.
? Service Delivery Type Toggle (Radio Button):

? DIGITAL (Online delivery of files, data, consultations)
? PHYSICAL (On-site tasks, local physical labor)
Step 2: Dynamic Tiered Pricing Matrix
Developers must implement a three-tiered layout matrix supporting single or triple packages
(Basic, Standard, Premium).
? Package Details: Title (30 chars), Description (100 chars), Delivery Time
(Dropdown: 1 day to 90 days), and Revisions (Dropdown: 0 to Unlimited).
? Custom Metadata Checkboxes: Dynamic boolean fields loaded via backend API
depending on subcategory (e.g., if Category = "Web Dev", show "Source File",
"Responsive Design").
? Service Extras (Upselling Engine): Repeatable component row letting sellers add
custom line items.
? Fields: Extra Description (Text), Added Price (Currency), Added Delivery Time
(Dropdown days).
Step 3: Service Location & Booking (Conditional UI)
? Visibility: Rendered only if Service Delivery Type is PHYSICAL.
? Geofencing Radius Set:
? Postal Code baseline input field.
? Travel Radius input field (Integer) + unit dropdown (Miles/KM).
? Backend dependency: Integrate Google Maps API to draw a visual boundary
circle on the front-end map.
? Availability Planner Calendar: A grid matrix representing the 7 days of the week
split into customized time slots (e.g., 9:00 AM û 5:00 PM) where the seller is
available for on-site deployment.
Step 4: Media Gallery & Portfolio Slots
? Image Upload component: Up to 5 image slots. Constraints: WebP, JPEG, or PNG
format. Max 5MB per file. Automatically optimize and compress images on the client
side before Amazon S3 bucket upload.
? Video Upload component: 1 video slot. Constraints: MP4 format, max 50MB, max
duration 60 seconds.
? Document Upload component: Up to 2 PDF files (useful for tech specs,
qualifications, or resumes).
Step 5: The Requirements Gateway
? Description Area: Markdown editor supporting up to 1,200 characters explaining the
service details.
? Buyer Instructions Form Builder: A tool for sellers to configure mandatory fields
that buyers must fill after checkout.

? Supported Input fields: Free text box, multiple choice select, or mandatory file
attachment toggle.
3. Epic 2: Checkout & The Delivery Gateway
The Requirements Gate Logic (State Machine)
Unlike products where shipping starts instantly, service orders require an explicit onboarding
gate.
[Order Paid: Status = AWAITING_REQUIREMENTS]
?
(Buyer Submits Requirements)
?
[Order Status = IN_PROGRESS (Countdown Clock Starts)]
? Rule: The fulfillment delivery countdown clock must not start, and the order status
must remain AWAITING_REQUIREMENTS until the buyer completes the mandatory
fields designed in Step 5 of the creation wizard.
? Fallback automated rule: If the buyer does not submit requirements within 48
hours, an automated system alert triggers an option for the seller to cancel the order
without negative impact on their rating.
The Live Order Room Feed
A dedicated workspace dashboard page created dynamically per order ID.
? Component 1: Visual Timeline Tracking: Displays clear milestones: Ordered ?
Requirements Submitted ? Work Started ? In Review ? Complete.
? Component 2: Real-time Communication Widget: A WebSocket-connected text
chat stream allowing text updates and attachment uploads directly inside the
workspace.
? Component 3: Countdown Timer Widget: A real-time visual clock ticking down the
hours and minutes left until the contract deadline expires. Emits a styling color shift to
red when < 12 hours remain.
? Component 4: Delivery CTA Block: Accessible exclusively by the seller. Opens a
submission box modal containing a file upload area and text description to mark the
order as DELIVERED.
4. Epic 3: Core Financial & Database Infrastructure Upgrades

Escrow Ledger Management
The architecture must deprecate instantaneous merchant disbursement upon checkout.
? Holding State: When a buyer checks out, payment processors capture 100% of the
funds. The funds are routed into a platform-controlled escrow holding account.
? Release Event: Funds are held securely until:
1. The buyer clicks the "Accept Delivery & Release Funds" button.
2. The order hits the Auto-Approve Window (system clock exceeds 3 calendar
days after delivery without a dispute logged by the buyer).
? Payout calculation formulas:
$$\text{Platform Commission Fee} = \text{Gross Order Amount} \times \text{Platform
Commission Percentage}$$
$$\text{Seller Net Earnings} = \text{Gross Order Amount} - \text{Platform
Commission Fee}$$
Updated Database Schema Modifications (High Level)
Engineers must extend the existing schema to accommodate the following entities:
CREATE TABLE services (
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
seller_id BIGINT REFERENCES users(id),
title VARCHAR(80) NOT NULL,
delivery_type VARCHAR(10) CHECK (delivery_type IN ('DIGITAL', 'PHYSICAL')),
description TEXT,
category_id INT,
status VARCHAR(15) DEFAULT 'DRAFT',
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE service_packages (
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
service_id BIGINT REFERENCES services(id) ON DELETE CASCADE,
tier_type VARCHAR(10) CHECK (tier_type IN ('BASIC', 'STANDARD', 'PREMIUM')),
price NUMERIC(10, 2) NOT NULL,
delivery_days INT NOT NULL,
revisions_allowed INT DEFAULT 0
);
CREATE TABLE service_orders (
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
buyer_id BIGINT REFERENCES users(id),
service_id BIGINT REFERENCES services(id),
package_id BIGINT REFERENCES service_packages(id),
escrow_status VARCHAR(20) DEFAULT 'HELD',
order_status VARCHAR(30) DEFAULT 'AWAITING_REQUIREMENTS',

deadline_timestamp TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
5. Non-Functional Requirements & Security Guarantees
Performance & Latency Metrics
? Messaging System: Chat communication logs within the Order Room must display
to all active participants within an end-to-end network latency of < 300ms using
persistent WebSocket loops or gRPC protocols.
? Page Responsiveness: Add Service layout fields must maintain smooth
cross-platform parity. 100% feature availability on standard desktop viewports down
to iOS Safari and Android Chrome mobile layouts.
Strict File Security Protocols
? All digital asset deliveries uploaded by users via the messaging portal or delivery
modal must run through an asynchronous background anti-virus scanner hook script
(e.g., ClamAV API) prior to permanent storage bucket confirmation.
? Any files flagging malicious structures or macro attachments must be immediately
deleted, dropping a system alert on the user interface block.
6. Verification & Edge Case Scenarios
Test ID Scenario Context Operational System
Expectation
TC-001 Seller tries to input a local The system ui hides the
travel radius for a DIGITAL physical location data
classified service asset. modules entirely. API blocks
geo payloads on digital
parameters.
TC-002 Seller submits an official Order room appends a fixed
delivery 10 minutes past the LATE system tag to the
target header metadata block.
deadline_timestamp. Triggers automated
eligibility criteria for instant
buyer refunds if requested.

| TC-003  | Buyer submits a file           | The active countdown timer  |
| ------- | ------------------------------ | --------------------------- |
|         | deliverable review rejection,  | pauses. Order status        |
|         | asking for modifications.      | reverts smoothly from       |
IN_REVIEW straight back
into IN_PROGRESS state.
Decrements remaining
active structural revisions
counter variable by 1.
