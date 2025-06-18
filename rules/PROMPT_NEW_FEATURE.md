🎯 **Project Context**: Berally Chat - Real-time chat application

📁 **Tech Stack**: 
- Next.js 14 + TypeScript
- Supabase (PostgreSQL + Auth + Realtime)
- Material-UI v5 with custom theme
- Running on localhost:3001

✅ **Current Status**:
- Authentication system working (email/password with Supabase)
- Modern UI implemented with gradient header, enhanced room list, chat bubbles
- Database schema with users/profiles tables and triggers
- Real-time chat structure in place
- All components: ChatLayout, RoomList, Conversation, RequireAuth

🎨 **Current Features**:
- User signup/login with automatic profile creation
- Room navigation with unread badges and activity indicators
- Modern chat interface with message bubbles and avatars
- Floating action button for room creation (UI only)
- Responsive design with drawer navigation

📂 **Key Files**:
- `src/components/ChatLayout.tsx` - Main layout with header/sidebar
- `src/components/RoomList.tsx` - Enhanced room list with badges
- `src/components/Conversation.tsx` - Chat interface with message input
- `src/components/RequireAuth.tsx` - Authentication wrapper
- `src/database.sql` - Database schema and triggers
- `src/mock/rooms.ts` - Mock data for development
- `src/themes/theme.ts` - Material-UI theme with gradients

🎯 **New Feature Request**: [DESCRIBE YOUR FEATURE HERE]

💡 **Specific Goals**:
- [List specific functionality you want]
- [Any UI/UX requirements]
- [Integration points with existing features]

🔧 **Technical Preferences**:
- Keep consistent with existing Material-UI design system
- Maintain TypeScript strict typing
- Follow existing code patterns and structure
- Ensure mobile responsiveness

🎯 **Project Context**: Berally Chat - Real-time chat application

📁 **Tech Stack**: Next.js 14 + TypeScript, Supabase, Material-UI v5, localhost:3001

✅ **Current Status**: Authentication working, modern UI implemented, database schema with triggers, real-time chat structure ready

🎯 **New Feature Request**: Real-time messaging functionality

💡 **Specific Goals**:
- Send/receive messages in real-time using Supabase Realtime
- Store messages in PostgreSQL with proper relationships
- Display messages with timestamps and sender info
- Handle message status (sent, delivered, read)
- Implement typing indicators

🔧 **Technical Preferences**: Keep Material-UI design, TypeScript strict, mobile responsive