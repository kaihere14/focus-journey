# FocusJourney

## Overview

FocusJourney is a focus/productivity app inspired by road travel. Instead of treating a work session as just a timer, it represents the session as a journey from a starting point to a destination.

The goal is to make focused work feel like measurable movement: users start a journey, progress along a virtual road, pass checkpoints, see an ETA, and eventually arrive at their destination.

## Core Idea

> Turn time spent focusing into a journey you can complete.

A typical focus app says:

`45 minutes remaining`

FocusJourney should instead communicate:

`32 km until arrival`

The underlying timer still drives the session, but the user experiences that time as progress through a journey.

## Why

Most focus apps reduce productivity to a timer. FocusJourney uses a travel metaphor to create a stronger sense of movement, progress, checkpoints, and arrival.

The product should feel like a **travel experience**, not another Pomodoro clone.

## Current Product Direction

The initial product is focused on the experience of a road journey.

Core concepts:

- Starting location
- Destination
- Journey duration
- Virtual route
- Progress along the route
- Checkpoints
- ETA
- Journey phases
- Journey completion
- Travel/journey history

The first version should remain simple and should not attempt to become a transportation, taxi, or navigation platform.

## Current Data Model

The initial database intentionally contains only two core models.

### User

Represents the user's current state.

Key data:

- `id`
- `name`
- `email`
- `currentLatitude`
- `currentLongitude`
- `currentLocationName`
- `createdAt`

The user's current location starts as their detected location. After completing a journey, the current location is updated to the journey's destination.

### TravelHistory

Represents completed journeys.

Key data:

- `id`
- `userId`
- `fromLatitude`
- `fromLongitude`
- `fromLocationName`
- `toLatitude`
- `toLongitude`
- `toLocationName`
- `startedAt`
- `completedAt`
- `duration`

Relationship:

`User 1 → N TravelHistory`

The `TravelHistory` model should remain focused on recording past journeys. Do not add unrelated concepts to it.

## Location Flow

### First Journey

1. Detect the user's current location.
2. Store it as the user's current location.
3. User selects a destination.
4. Start the journey.
5. Track journey progress.
6. Complete the journey.
7. Create a `TravelHistory` record.
8. Update the user's current location to the destination.

### Subsequent Journeys

The previous destination becomes the user's current starting location.

Example:

`Delhi → Jaipur`

After completion:

`User.currentLocation = Jaipur`

Travel history:

`Delhi → Jaipur`

Next journey:

`Jaipur → Ajmer`

## Product Questions

These are intentionally unresolved and should be considered before implementing the related functionality:

- How should journey progress be visualized?
- Should users create their own routes/destinations?
- What should happen when a user gets distracted or leaves the session?
- Should real maps/GPS be part of the product or only provide inspiration?
- Should the route represent actual geographic distance or simply represent focus-session progress?

Do not assume answers to these questions without explicit product decisions.

## Planned Development

1. Design the core journey UI.
2. Build the focus session and timer.
3. Add route progress, checkpoints, and ETA.
4. Add journey completion and session history.
5. Explore optional maps/GPS integration later.

Implementation should be incremental. Do not introduce infrastructure or abstractions before they are required by an actual feature.

## Design Direction

The interface should take inspiration from travel and flight-tracking experiences:

- Clear origin and destination
- Strong visual route
- Progress indicator
- ETA
- Journey status
- Checkpoints
- Arrival state
- Historical journeys

However, FocusJourney should develop its own visual identity rather than copying another product.

The core emotional model is:

`Start → Move → Progress → Arrive`

## Scope Principles

Keep the first version deliberately small.

Avoid adding:

- Separate location models
- Separate route models
- Separate journey models
- Checkpoint database models unless required
- Focus-session database models unless required
- Analytics infrastructure
- Transportation/driver functionality
- Unnecessary backend services

Prefer simple implementations and evolve the architecture when real requirements appear.

## Reference

### FocusFlight

FocusJourney's initial conceptual inspiration includes FocusFlight, a focus timer that uses a flight/travel metaphor.

https://apps.apple.com/in/app/focusflight-deepfocus-timer/id6648771147

FocusFlight is a reference for the general product concept, not a specification to copy.

## Guidance for Future AI Work

When modifying or extending FocusJourney, treat this document as the current product context.

Before implementing a new feature:

1. Check whether it fits the core journey concept.
2. Check whether it requires changes to the current data model.
3. Prefer extending existing structures over creating unnecessary abstractions.
4. Do not invent unresolved product decisions.
5. Keep the MVP focused on the journey experience.
6. Preserve the distinction between the user's **current location** and their **historical journeys**.

If a future requirement conflicts with this document, the newer explicit product decision takes precedence.
