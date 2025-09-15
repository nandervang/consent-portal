# Academic Consent Portal

A modern web application for managing informed consent in academic research studies, built with React, TypeScript, and Supabase. The portal uses Swedish Bank ID for secure participant authentication and provides comprehensive consent management for researchers.

![Consent Portal Screenshot](https://github.com/user-attachments/assets/f979afb6-4122-4b43-8f34-a6f64a22ee8b)

## 🌟 Features

- **🔐 Bank ID Authentication**: Secure identity verification using Swedish Bank ID
- **📄 PDF Consent Management**: Upload, display, and manage consent documents
- **👥 Role-based Access**: Support for participants, researchers, and administrators  
- **📊 Study Management**: Create and manage multiple concurrent research studies
- **✅ Consent Tracking**: Comprehensive audit trail of consent decisions
- **🔄 Consent Withdrawal**: GDPR-compliant consent withdrawal process
- **📱 Responsive Design**: Modern, mobile-friendly user interface

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage)
- **Authentication**: Bank ID integration + Supabase Auth
- **PDF Handling**: react-pdf library
- **Styling**: Custom CSS with responsive design
- **Testing**: Vitest, React Testing Library, Playwright

## 📋 Project Structure

This project follows the [GitHub spec-kit](https://github.com/github/spec-kit) methodology for spec-driven development:

```
├── specs/001-consent-portal/          # Complete feature specification
│   ├── spec.md                        # User requirements and scenarios
│   ├── plan.md                        # Technical implementation plan
│   ├── research.md                    # Technology research and decisions
│   ├── data-model.md                  # Database schema and entities
│   ├── quickstart.md                  # Setup and testing guide
│   └── contracts/api-spec.json        # OpenAPI specification
└── frontend/                          # React TypeScript application
    ├── src/
    │   ├── components/                # React components
    │   ├── pages/                     # Route pages
    │   ├── services/                  # API services
    │   ├── types/                     # TypeScript definitions
    │   └── utils/                     # Helper functions
    └── supabase/                      # Database migrations & config
```

## 🏗️ Architecture

The consent portal implements a modern web application architecture:

### Database Design (PostgreSQL via Supabase)
- **Users**: Bank ID verified participants and researchers
- **Studies**: Academic research projects with metadata
- **Consent Records**: Timestamped consent decisions with audit trails  
- **PDF Documents**: Secure file storage with access control

### Authentication Flow
1. User enters Swedish personal number
2. Bank ID authentication initiated via Supabase Edge Function
3. Real-time status polling until completion
4. User profile created/updated with verified identity
5. Session management through Supabase Auth

### Security Features
- Row Level Security (RLS) policies for data access
- Bank ID transaction verification
- Secure PDF storage with signed URLs
- Complete audit logging for compliance

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for full functionality)

### Quick Start

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd consent-portal/frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:5173
   - Use test personal number: `197810126789`

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BANKID_TEST_MODE=true
VITE_BANKID_API_URL=https://appapi2.test.bankid.com/rp/v6.0
```

## 📚 Documentation

Comprehensive documentation following spec-kit methodology:

- **[Feature Specification](specs/001-consent-portal/spec.md)** - User requirements and acceptance criteria
- **[Implementation Plan](specs/001-consent-portal/plan.md)** - Technical architecture and approach
- **[Research Document](specs/001-consent-portal/research.md)** - Technology decisions and rationale
- **[Data Model](specs/001-consent-portal/data-model.md)** - Database schema and relationships
- **[Quickstart Guide](specs/001-consent-portal/quickstart.md)** - Detailed setup instructions
- **[API Specification](specs/001-consent-portal/contracts/api-spec.json)** - OpenAPI documentation

## 🧪 Testing

The project includes comprehensive testing at multiple levels:

```bash
# Unit and integration tests
npm run test:unit

# End-to-end tests
npm run test:e2e

# Build verification
npm run build
```

## 🔒 Compliance & Security

- **GDPR Compliant**: Right to withdraw consent, data portability, audit trails
- **Academic Standards**: Follows research ethics guidelines for informed consent
- **Bank ID Integration**: Secure identity verification for Swedish users
- **Data Security**: Encrypted storage, access controls, secure file handling

## 🚢 Deployment

The application is designed for deployment on Vercel with Supabase backend:

1. **Build production bundle**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure production environment variables in Vercel dashboard**

## 📈 Current Implementation Status

✅ **Completed**:
- Comprehensive spec-driven development documentation
- React TypeScript frontend with modern UI
- Bank ID authentication flow (test mode)
- Responsive design and user experience
- Database schema and data modeling
- Security architecture planning

🚧 **In Development** (Next Phase):
- Supabase database setup and migrations
- Complete Bank ID integration with Edge Functions
- PDF upload and display functionality
- Full CRUD operations for studies and consent
- Production deployment pipeline

## 🤝 Contributing

This project follows spec-driven development principles:

1. Start with user scenarios and requirements
2. Create technical specifications before coding
3. Implement with testing throughout
4. Validate against specifications

See the [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Built using [GitHub spec-kit](https://github.com/github/spec-kit) methodology
- Bank ID integration for Swedish digital identity
- Supabase for backend infrastructure
- React and TypeScript for modern web development