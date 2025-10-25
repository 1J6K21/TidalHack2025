# Requirements Document

## Introduction

BuildFlow is a nostalgic, Lego-inspired web application that helps engineers and creative builders generate and visualize DIY projects. Users can browse existing project manuals or input product ideas to receive detailed build instructions, materials lists, and pricing information. The system displays these as visual flipbooks with realistic step images, integrating Gemini AI and Firebase Cloud Storage for all data management.

## Glossary

- **BuildFlow System**: The complete web application including frontend, backend services, and data storage
- **Manual**: A complete DIY project guide containing steps, materials, pricing, and visualizations
- **Flipbook View**: Interactive step-by-step instruction display with forward/backward navigation
- **Demo Mode**: System state where all data is preloaded from Firebase Cloud Storage (state = true)
- **Live Mode**: System state where Gemini generates new content dynamically (state = false)
- **Materials Grid**: Visual display of required materials with images, quantities, and pricing
- **Step Visualization**: Realistic images showing each construction step
- **Firebase Manual Path**: Firebase Cloud Storage location for manual JSON data
- **Firebase Image Path**: Firebase Cloud Storage location for step visualization images

## Requirements

### Requirement 1

**User Story:** As a builder, I want to view previously created project manuals, so that I can access existing DIY instructions without generating new content.

#### Acceptance Criteria

1. WHEN the BuildFlow System loads the homepage, THE BuildFlow System SHALL display all available manuals from Firebase Cloud Storage demo data
2. THE BuildFlow System SHALL display each manual with product name, thumbnail image, and "Open Manual" button
3. WHEN a user clicks "Open Manual", THE BuildFlow System SHALL load the complete manual from the specified Firebase manual path
4. THE BuildFlow System SHALL fetch manual data from the /manuals/demo/ Firebase Cloud Storage directory structure
5. THE BuildFlow System SHALL display manual thumbnails using URLs retrieved from Firebase Cloud Storage

### Requirement 2

**User Story:** As a builder, I want to input a product idea and receive generated build instructions, so that I can create custom DIY projects.

#### Acceptance Criteria

1. THE BuildFlow System SHALL provide a text input field for product ideas on the homepage
2. WHEN a user submits a product idea, THE BuildFlow System SHALL send the request to Gemini API directly from the frontend
3. THE BuildFlow System SHALL generate step-by-step build protocols using Gemini AI
4. THE BuildFlow System SHALL generate tools and materials lists with quantities and descriptions
5. THE BuildFlow System SHALL calculate itemized and total pricing for all materials
6. WHILE Demo Mode is active, THE BuildFlow System SHALL display a message indicating live generation is disabled

### Requirement 3

**User Story:** As a builder, I want to review materials and pricing before proceeding, so that I can make informed decisions about the project cost and complexity.

#### Acceptance Criteria

1. THE BuildFlow System SHALL display materials in a grid format with images, names, quantities, and pricing
2. THE BuildFlow System SHALL provide hyperlinks to Amazon or Firebase demo links for each material
3. THE BuildFlow System SHALL calculate and display total price summary at the bottom of the materials view
4. THE BuildFlow System SHALL provide "Confirm" and "Cancel" action buttons
5. WHEN a user clicks "Confirm", THE BuildFlow System SHALL proceed to the Flipbook View
6. WHEN a user clicks "Cancel", THE BuildFlow System SHALL return to the Homepage

### Requirement 4

**User Story:** As a builder, I want to view step-by-step instructions in an interactive flipbook format, so that I can follow the build process easily.

#### Acceptance Criteria

1. THE BuildFlow System SHALL display Page 1 as a materials grid with images and Amazon links
2. THE BuildFlow System SHALL display subsequent pages with one instruction step each
3. THE BuildFlow System SHALL show step number, description, and product name on each page
4. THE BuildFlow System SHALL display realistic visualization images for each step
5. THE BuildFlow System SHALL provide forward and backward navigation with flip animations
6. THE BuildFlow System SHALL load step images from Firebase Cloud Storage under /testuser/{projectName}/steps/
7. THE BuildFlow System SHALL display product name and image in the top-right legend area

### Requirement 5

**User Story:** As a system administrator, I want to control data sources through a state variable, so that I can toggle between live generation and demo modes.

#### Acceptance Criteria

1. WHILE state equals true, THE BuildFlow System SHALL pull all instructions and materials from preloaded Firebase Cloud Storage data
2. WHILE state equals true, THE BuildFlow System SHALL load step images from Firebase Cloud Storage
3. WHILE state equals false, THE BuildFlow System SHALL generate new instructions dynamically using Gemini
4. WHILE state equals false, THE BuildFlow System SHALL generate new materials and pricing using Gemini
5. THE BuildFlow System SHALL maintain consistent data structure regardless of state value

### Requirement 6

**User Story:** As a builder, I want to see a preview of premium features, so that I understand the full potential of the platform.

#### Acceptance Criteria

1. THE BuildFlow System SHALL display a "Generate Construction Clip" button at the end of each manual
2. THE BuildFlow System SHALL render the button in a grayed-out, disabled state
3. WHEN a user hovers over the disabled button, THE BuildFlow System SHALL display tooltip text "Pro users only"
4. THE BuildFlow System SHALL prevent any functionality when the disabled button is clicked
5. THE BuildFlow System SHALL position the button prominently on the final flipbook page

### Requirement 7

**User Story:** As a builder, I want smooth navigation between different views, so that I can move through the application efficiently.

#### Acceptance Criteria

1. THE BuildFlow System SHALL provide navigation from any page back to the homepage
2. THE BuildFlow System SHALL maintain application state during navigation transitions
3. THE BuildFlow System SHALL implement smooth animations for page transitions using Framer Motion
4. WHEN navigation occurs, THE BuildFlow System SHALL preserve user progress within the current session
5. THE BuildFlow System SHALL provide clear visual indicators for current page location