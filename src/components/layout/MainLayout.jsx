import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import MobileNav from './MobileNav';
import FeedPage from '../feed/FeedPage';

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      {/* Desktop: 3-column layout */}
      <div className="max-w-[1280px] mx-auto flex">
        {/* Left sidebar */}
        <div className="hidden lg:block w-[68px] xl:w-[240px] shrink-0 border-r border-surface-800/60">
          <Sidebar />
        </div>

        {/* Main feed column */}
        <main className="flex-1 max-w-[600px] mx-auto w-full border-r border-surface-800/60 min-h-screen pb-20 lg:pb-0">
          <FeedPage />
        </main>

        {/* Right panel */}
        <div className="hidden lg:block w-[320px] xl:w-[350px] shrink-0">
          <RightPanel />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
