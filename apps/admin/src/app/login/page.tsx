import { siteName } from '@monkei/shared';
import logo from '../../assets/logo.png';
import { LoginForm } from './login-form';

// Without this, Next prerenders this page as static HTML at `next build`
// time — inside the Docker build stage, which has no real .env secrets — and
// the brand name below would freeze at whatever LEGAL_BUSINESS_NAME resolved
// to there. Same trap the legal pages hit before force-dynamic was added to
// them too; /login/verify next door already has this for the same reason.
export const dynamic = 'force-dynamic';

// Server component so the brand header can read LEGAL_BUSINESS_NAME directly
// — the interactive form below needs useActionState, which the brand text
// itself does not, so only that part is a client component.
export default function LoginPage() {
  return (
    <main className="login-page">
      <div className="card login-card">
        <div className="brand" style={{ padding: '0 0 18px' }}>
          <img src={logo.src} width={32} height={32} alt="" />
          <span>{siteName().toUpperCase()}</span>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
