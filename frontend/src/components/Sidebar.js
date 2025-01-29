import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Database,
  LineChart,
  Binoculars,
  ChevronLeft,
  ChevronRight,
  Activity,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  CalendarCheck,
  Trophy,
  User2,
} from "lucide-react";
import AuthManager from "../managers/AuthManager";
import SubscriptionManager from "../managers/SubscriptionManager";

const PremiumBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-500 text-white">
    Premium
  </span>
);

// Separate Subscription Link component
const SubscriptionLink = ({ isPremiumUser }) => (
  <Link
    to="/subscriptions"
    className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
  >
    {isPremiumUser ? "View plan" : "Upgrade to Premium"}
  </Link>
);

const UserSection = ({
  user,
  isPremiumUser,
  onSignOut,
  collapsed,
  mobileOpen,
}) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isLoading: true,
    isPremium: false,
  });

  useEffect(() => {
    let unsubscribe;

    const initializeSubscription = async () => {
      if (user?.uid) {
        setSubscriptionStatus((prev) => ({ ...prev, isLoading: true }));

        unsubscribe = SubscriptionManager.listenToSubscriptionUpdates(
          user.uid,
          (subscription) => {
            setSubscriptionStatus({
              isLoading: false,
              isPremium: subscription?.isActive || false,
            });
          }
        );
      } else {
        setSubscriptionStatus({
          isLoading: false,
          isPremium: false,
        });
      }
    };

    initializeSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const showPremiumBadge =
    !subscriptionStatus.isLoading &&
    (isPremiumUser || subscriptionStatus.isPremium);

  return (
    <div className="w-full space-y-1">
      <div
        className={`flex items-center h-11 px-4 rounded-lg text-gray-600 ${
          collapsed && !mobileOpen ? "justify-center" : ""
        }`}
      >
        <User2 className="w-5 h-5" strokeWidth={1.5} />
        {(!collapsed || mobileOpen) && (
          <div className="ml-3 overflow-hidden">
            <div className="text-sm font-medium truncate">
              {user?.email || "Anonymous"}
            </div>
            <div className="flex items-center space-x-2">
              {showPremiumBadge && <PremiumBadge />}
              <SubscriptionLink isPremiumUser={showPremiumBadge} />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onSignOut}
        className={`w-full flex items-center h-11 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 ${
          collapsed && !mobileOpen ? "justify-center" : ""
        }`}
      >
        <LogOut className="w-5 h-5" strokeWidth={1.5} />
        {(!collapsed || mobileOpen) && (
          <span className="ml-3 text-sm font-medium">Sign Out</span>
        )}
      </button>
    </div>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isAnonymous: false,
  });
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    const unsubscribeAuth = AuthManager.onAuthStateChanged(async (user) => {
      setUser(user);
      setAuthState({
        isAuthenticated: !!user,
        isAnonymous: user?.isAnonymous || false,
      });

      if (user) {
        SubscriptionManager.listenToSubscriptionUpdates(
          user.uid,
          (subscription) => {
            setIsPremiumUser(subscription?.isActive || false);
          }
        );
      } else {
        setIsPremiumUser(false);
      }
    });

    return () => {
      unsubscribeAuth();
      SubscriptionManager.stopListening();
    };
  }, []);

  const handleSignOut = async () => {
    const result = await AuthManager.signOut();
    if (result.success) {
      navigate("/signin");
    }
  };

  const MenuItem = ({
    icon: Icon,
    to,
    onClick,
    children,
    isActive = false,
  }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center h-11 px-4 rounded-lg transition-all duration-200 ${
        isActive
          ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-blue-50"
      }`}
    >
      <Icon
        className={`w-5 h-5 ${collapsed && !mobileOpen ? "mx-auto" : ""}`}
        strokeWidth={1.5}
      />
      {(!collapsed || mobileOpen) && (
        <span className="ml-3 text-sm font-medium">{children}</span>
      )}
    </Link>
  );

  const isActiveRoute = (path) => location.pathname === path;

  const renderAuthButton = () => {
    if (authState.isAuthenticated && !authState.isAnonymous) {
      return (
        <>
          {authState.isAuthenticated && !authState.isAnonymous && (
            <UserSection
              user={user}
              isPremiumUser={isPremiumUser}
              onSignOut={handleSignOut}
              collapsed={collapsed}
              mobileOpen={mobileOpen}
            />
          )}
        </>
      );
    }

    return (
      <>
        <Link
          to="/signin"
          className={`w-full flex items-center h-11 px-4 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
        >
          <LogIn className="w-5 h-5" strokeWidth={1.5} />
          {(!collapsed || mobileOpen) && (
            <span className="ml-3 text-sm font-medium">Sign In</span>
          )}
        </Link>
        <Link
          to="/signin?signup=true"
          className={`w-full flex items-center h-11 px-4 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 ${
            collapsed && !mobileOpen ? "justify-center" : ""
          }`}
        >
          <UserPlus className="w-5 h-5" strokeWidth={1.5} />
          {(!collapsed || mobileOpen) && (
            <span className="ml-3 text-sm font-medium">Create Account</span>
          )}
        </Link>
      </>
    );
  };

  const MobileMenuButton = () => (
    <button
      onClick={() => setMobileOpen(!mobileOpen)}
      className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200"
    >
      {mobileOpen ? (
        <X className="w-6 h-6 text-gray-600" />
      ) : (
        <Menu className="w-6 h-6 text-gray-600" />
      )}
    </button>
  );

  const sidebarClasses = `
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    ${collapsed && !mobileOpen ? "w-20" : "w-64"}
    lg:translate-x-0
    fixed inset-y-0 left-0 z-40
    transition-all duration-300 
    border-r border-gray-200 
    bg-white flex flex-col
    lg:relative
  `;

  return (
    <>
      <MobileMenuButton />
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className={sidebarClasses}>
        {/* Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          {collapsed && !mobileOpen ? (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xl">D3</span>
            </div>
          ) : (
            <div className="px-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xl">D3</span>
              </div>
              <span className="font-semibold text-gray-800 text-lg">
                Dashboard
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <MenuItem icon={Home} to="/" isActive={isActiveRoute("/")}>
            Home
          </MenuItem>
          <MenuItem
            icon={Database}
            to="/data"
            isActive={isActiveRoute("/data")}
          >
            Data
          </MenuItem>
          <MenuItem
            icon={LineChart}
            to="/charting"
            isActive={isActiveRoute("/charting")}
          >
            Charting
          </MenuItem>
          <MenuItem
            icon={Binoculars}
            to="/scouting"
            isActive={isActiveRoute("/scouting")}
          >
            Scouting Reports
          </MenuItem>
          <MenuItem
            icon={Activity}
            to="/guts"
            isActive={isActiveRoute("/guts")}
          >
            Guts
          </MenuItem>
          <MenuItem
            icon={Trophy}
            to="/leaderboards"
            isActive={isActiveRoute("/leaderboards")}
          >
            Leaderboards
          </MenuItem>
          <MenuItem
            icon={CalendarCheck}
            to="/scoreboard"
            isActive={isActiveRoute("/scoreboard")}
          >
            Scoreboard
          </MenuItem>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 space-y-1.5">
          {renderAuthButton()}

          {/* Only show collapse button on desktop */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center h-11 px-4 text-gray-500 hover:bg-gray-100 rounded-lg transition-all duration-200 ${
              collapsed && !mobileOpen ? "justify-center" : ""
            }`}
          >
            {collapsed && !mobileOpen ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="ml-3 text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
