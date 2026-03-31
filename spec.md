# FaceAttend

## Current State
- App has 5 nav items: Face Scan, Register, Report, Settings, Dashboard
- Report page (`Report.tsx`) has two tabs: Attendance Records (filterable table + CSV download) and Manage Persons (edit/delete with camera-based photo recapture)
- Dashboard page has two tabs: Attendance Records (filterable, edit/delete) and People (simple edit/delete without camera)
- Dashboard nav item is last in the navbar (after Settings)

## Requested Changes (Diff)

### Add
- CSV download button to the Dashboard page, placed near/within the "Manage People" section
- Richer EditPersonDialog (with camera-based face photo recapture) into Dashboard.tsx, replacing the current simpler edit dialog for persons

### Modify
- Rename "People" tab to "Manage People" in Dashboard
- Replace Dashboard's simple person edit/delete dialogs with the full camera-enabled EditPersonDialog and DeletePersonDialog from Report.tsx
- Reposition Dashboard nav item to be right before Settings: Face Scan > Register > Dashboard > Settings
- Remove the Report route from App.tsx and the Report link from Navbar.tsx

### Remove
- Entire Report page (`Report.tsx`) from routing (App.tsx) and navigation (Navbar.tsx)
- Old simpler person-editing dialogs from Dashboard (replaced by richer ones)

## Implementation Plan
1. **App.tsx**: Remove Report import and reportRoute; keep reportRoute import only if needed for other routes
2. **Navbar.tsx**: Remove Report nav item; reorder to [Face Scan, Register, Dashboard, Settings]
3. **Dashboard.tsx**:
   - Copy EditPersonDialog (with useCamera, face AI, photo recapture), DeletePersonDialog, ManagePersons components from Report.tsx
   - Add formatDateDisplay helper and downloadCSV function using attendance + persons data
   - Add CSV download button at the top of the Manage People tab content (above the persons table)
   - Rename "People" TabsTrigger to "Manage People"
   - Replace People tab content with ManagePersons component + CSV download button
   - Remove old simpler per-person edit/delete state and dialogs
   - Add missing imports: useCamera, AlertDialog family, model utils, useUpdatePersonDescriptor
