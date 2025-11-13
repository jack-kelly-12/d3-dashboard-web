import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";
import RecruitModal from "../components/modals/RecruitModal";
import TransferPortalModal from "../components/modals/TransferPortalModal";
import WriteupsViewerModal from "../components/modals/WriteupsViewerModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import FilterModal from "../components/modals/FilterModal";
import PasswordModal from "../components/modals/PasswordModal";
import StatsCards from "../components/recruitment/StatsCards";
import RecruitCard from "../components/recruitment/RecruitCard";
import StatusDropdown from "../components/recruitment/StatusDropdown";
import EmptyState from "../components/recruitment/EmptyState";
import InfoBanner from "../components/data/InfoBanner";
import RecruitManager from "../managers/RecruitManager";
import RecruitPasswordManager from "../managers/RecruitPasswordManager";
import FeatureFlagManager from "../managers/FeatureFlagManager";
import AuthManager from "../managers/AuthManager";
import { LoadingState } from "../components/alerts/Alerts";

const Recruitment = () => {
  const [activeView, setActiveView] = useState("recruiting");
  const [recruits, setRecruits] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingRecruit, setEditingRecruit] = useState(null);
  const [initialTab, setInitialTab] = useState("info");
  const [quickEditRecruit, setQuickEditRecruit] = useState(null);
  const [writeupsViewerData, setWriteupsViewerData] = useState({ isOpen: false, writeups: [], playerName: '' });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, recruitId: null, recruitName: null });
  const [deleting, setDeleting] = useState(false);
  const quickEditRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPasswordSetup, setIsPasswordSetup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasFeatureAccess, setHasFeatureAccess] = useState(false);
  const [filters, setFilters] = useState({
    tags: [],
    schools: [],
    years: [],
    positions: [],
    gpa: { min: 0, max: 4.0 },
    exitVelocity: { min: 50, max: 120 },
    infieldVelocity: { min: 50, max: 100 },
    outfieldVelocity: { min: 60, max: 100 },
    moundVelocity: { min: 60, max: 100 },
    sixtyYardDash: { min: 5.5, max: 8.0 },
    height: { min: 60, max: 80 },
    weight: { min: 100, max: 300 }
  });

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const unsubscribeAuth = AuthManager.onAuthStateChanged(async (currentUser) => {
        if (!isMounted) return;

        setUser(currentUser);

        try {
          if (!currentUser) {
            const result = await AuthManager.anonymousSignIn();
            if (result.success && isMounted) {
              setUser(result.user);
              currentUser = result.user;
            }
          }

          if (currentUser) {
            const featureAccess = await FeatureFlagManager.hasAccessToFeature("recruiting");
            
            if (!featureAccess) {
              if (isMounted) {
                setHasFeatureAccess(false);
                setLoading(false);
                setIsAuthReady(true);
              }
              return;
            }

            setHasFeatureAccess(true);
            const hasActiveAccess = await RecruitPasswordManager.hasActiveAccess();
            
            if (hasActiveAccess) {
              const userRecruits = await RecruitManager.getUserRecruits();
              if (isMounted) {
                setRecruits(userRecruits);
                setHasAccess(true);
              }
            } else {
              const hasPassword = await RecruitPasswordManager.hasPassword();
              if (isMounted) {
                setIsPasswordSetup(!hasPassword);
                setIsPasswordModalOpen(true);
              }
            }
          }
        } catch (err) {
          console.error("Error in auth initialization:", err);
          toast.error("Failed to initialize. Please try again.");
        } finally {
          if (isMounted) {
            setLoading(false);
            setIsAuthReady(true);
          }
        }
      });

      return unsubscribeAuth;
    };

    const cleanup = initializeAuth();

    return () => {
      isMounted = false;
      cleanup.then((unsubscribe) => unsubscribe());
    };
  }, []);

  const handlePasswordSuccess = async () => {
    setIsPasswordModalOpen(false);
    setHasAccess(true);
    
    try {
      const userRecruits = await RecruitManager.getUserRecruits();
      setRecruits(userRecruits);
    } catch (err) {
      console.error("Error loading recruits:", err);
      toast.error("Failed to load recruits");
    }
  };

  const handleCreateRecruit = async (recruitData) => {
    if (!user || !isAuthReady) {
      toast.error("Please sign in to add recruits");
      return;
    }

    const loadingToast = toast.loading("Creating recruit...");
    try {
      const newRecruit = await RecruitManager.createRecruit(recruitData);
      setRecruits(prev => [newRecruit, ...prev]);
      toast.success("Recruit added successfully", { id: loadingToast });
    } catch (err) {
      console.error("Error creating recruit:", err);
      toast.error("Failed to add recruit", { id: loadingToast });
      throw err;
    }
  };

  const handleUpdateRecruit = async (recruitData) => {
    if (!user || !isAuthReady) {
      toast.error("Please sign in to update recruits");
      return;
    }

    const loadingToast = toast.loading("Updating recruit...");
    try {
      await RecruitManager.updateRecruit(editingRecruit.id, recruitData);
      setRecruits(prev =>
        prev.map(recruit =>
          recruit.id === editingRecruit.id
            ? { ...recruit, ...recruitData }
            : recruit
        )
      );
      toast.success("Recruit updated successfully", { id: loadingToast });
    } catch (err) {
      console.error("Error updating recruit:", err);
      toast.error("Failed to update recruit", { id: loadingToast });
      throw err;
    }
  };

  const handleDeleteClick = (recruitId) => {
    const recruit = recruits.find(r => r.id === recruitId);
    setDeleteConfirm({
      isOpen: true,
      recruitId,
      recruitName: recruit?.name || "this recruit"
    });
  };

  const handleDeleteConfirm = async () => {
    if (!user || !isAuthReady || !deleteConfirm.recruitId) {
      return;
    }

    setDeleting(true);
    try {
      await RecruitManager.deleteRecruit(deleteConfirm.recruitId);
      setRecruits(prev => prev.filter(recruit => recruit.id !== deleteConfirm.recruitId));
      setDeleteConfirm({ isOpen: false, recruitId: null, recruitName: null });
      toast.success("Recruit deleted successfully");
    } catch (err) {
      console.error("Error deleting recruit:", err);
      toast.error("Failed to delete recruit");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, recruitId: null, recruitName: null });
  };

  const handleEditRecruit = (recruit) => {
    setEditingRecruit(recruit);
    if (recruit.isTransferPortal) {
      setIsTransferModalOpen(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingRecruit(null);
    setInitialTab("info");
  };

  const handleTransferModalClose = () => {
    setIsTransferModalOpen(false);
    setEditingRecruit(null);
    setInitialTab("info");
  };

  const handleModalSubmit = async (recruitData) => {
    if (editingRecruit) {
      await handleUpdateRecruit(recruitData);
    } else {
      await handleCreateRecruit(recruitData);
    }
  };

  const handleQuickEditCancel = () => {
    setQuickEditRecruit(null);
  };

  const handleQuickTag = (recruit, event) => {
    event.stopPropagation();
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left
    });
    setQuickEditRecruit(recruit.id);
  };

  const handleQuickTagSave = async (recruitId, tag) => {
    if (!user || !isAuthReady) return;

    try {
      await RecruitManager.updateRecruit(recruitId, { tag });
      setRecruits(prev =>
        prev.map(recruit =>
          recruit.id === recruitId
            ? { ...recruit, tag }
            : recruit
        )
      );
      setQuickEditRecruit(null);
      toast.success("Status updated successfully");
    } catch (err) {
      console.error("Error updating recruit:", err);
      toast.error("Failed to update status");
    }
  };

  const handleViewWriteups = (recruit) => {
    setWriteupsViewerData({
      isOpen: true,
      writeups: recruit.coachWriteUps || [],
      playerName: recruit.name,
      recruitId: recruit.id
    });
  };

  const handleDeleteWriteup = async (writeupIndex) => {
    if (!writeupsViewerData.recruitId || !user || !isAuthReady) return;
    
    const recruit = recruits.find(r => r.id === writeupsViewerData.recruitId);
    if (!recruit) return;

    const updatedWriteups = [...(recruit.coachWriteUps || [])];
    updatedWriteups.splice(writeupIndex, 1);

    const loadingToast = toast.loading("Deleting write-up...");
    try {
      await RecruitManager.updateRecruit(recruit.id, { coachWriteUps: updatedWriteups });
      setRecruits(prev =>
        prev.map(r =>
          r.id === recruit.id
            ? { ...r, coachWriteUps: updatedWriteups }
            : r
        )
      );
      setWriteupsViewerData(prev => ({
        ...prev,
        writeups: updatedWriteups
      }));
      toast.success("Write-up deleted successfully", { id: loadingToast });
    } catch (err) {
      console.error("Error deleting write-up:", err);
      toast.error("Failed to delete write-up", { id: loadingToast });
    }
  };

  useEffect(() => {
    if (!quickEditRecruit) return;

    const handleClickOutside = (event) => {
      if (quickEditRef.current && !quickEditRef.current.contains(event.target)) {
        handleQuickEditCancel();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [quickEditRecruit]);

  if (!isAuthReady || loading) {
    return <LoadingState />;
  }

  if (!hasFeatureAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">You don&apos;t have access to the recruiting feature.</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onSuccess={handlePasswordSuccess}
        isSetup={isPasswordSetup}
      />
    );
  }

  const currentRecruit = recruits.find(r => r.id === quickEditRecruit);
  
  const filterRecruits = (recruitsList) => {
    let filtered = recruitsList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(recruit => {
        const name = (recruit.name || "").toLowerCase();
        return name.includes(query);
      });
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(recruit => {
        const tag = recruit.tag || "";
        return filters.tags.includes(tag);
      });
    }

    if (filters.schools.length > 0) {
      filtered = filtered.filter(recruit => {
        const school = recruit.highSchool || "";
        return filters.schools.includes(school);
      });
    }

    if (filters.years.length > 0) {
      filtered = filtered.filter(recruit => {
        const year = recruit.graduationYear || "";
        return filters.years.includes(String(year));
      });
    }

    if (filters.positions.length > 0) {
      filtered = filtered.filter(recruit => {
        const recruitPositions = recruit.positions || [];
        return filters.positions.some(pos => recruitPositions.includes(pos));
      });
    }

    if (filters.gpa && (filters.gpa.min !== 0 || filters.gpa.max !== 4.0)) {
      filtered = filtered.filter(recruit => {
        const gpa = parseFloat(recruit.gpa);
        if (isNaN(gpa)) return false;
        return gpa >= filters.gpa.min && gpa <= filters.gpa.max;
      });
    }

    if (filters.exitVelocity && (filters.exitVelocity.min !== 50 || filters.exitVelocity.max !== 120)) {
      filtered = filtered.filter(recruit => {
        const vel = parseFloat(recruit.measurables?.exitVelocity);
        if (!vel || isNaN(vel)) return false;
        return vel >= filters.exitVelocity.min && vel <= filters.exitVelocity.max;
      });
    }

    if (filters.infieldVelocity && (filters.infieldVelocity.min !== 50 || filters.infieldVelocity.max !== 100)) {
      filtered = filtered.filter(recruit => {
        const vel = parseFloat(recruit.measurables?.infieldVelocity);
        if (!vel || isNaN(vel)) return false;
        return vel >= filters.infieldVelocity.min && vel <= filters.infieldVelocity.max;
      });
    }

    if (filters.outfieldVelocity && (filters.outfieldVelocity.min !== 60 || filters.outfieldVelocity.max !== 100)) {
      filtered = filtered.filter(recruit => {
        const vel = parseFloat(recruit.measurables?.outfieldVelocity);
        if (!vel || isNaN(vel)) return false;
        return vel >= filters.outfieldVelocity.min && vel <= filters.outfieldVelocity.max;
      });
    }

    if (filters.moundVelocity && (filters.moundVelocity.min !== 60 || filters.moundVelocity.max !== 100)) {
      filtered = filtered.filter(recruit => {
        const vel = parseFloat(recruit.measurables?.moundVelocity);
        if (!vel || isNaN(vel)) return false;
        return vel >= filters.moundVelocity.min && vel <= filters.moundVelocity.max;
      });
    }

    if (filters.sixtyYardDash && (filters.sixtyYardDash.min !== 5.5 || filters.sixtyYardDash.max !== 8.0)) {
      filtered = filtered.filter(recruit => {
        const time = parseFloat(recruit.measurables?.sixtyYardDash);
        if (!time || isNaN(time)) return false;
        return time >= filters.sixtyYardDash.min && time <= filters.sixtyYardDash.max;
      });
    }

    if (filters.height && (filters.height.min !== 60 || filters.height.max !== 80)) {
      filtered = filtered.filter(recruit => {
        const heightStr = recruit.measurables?.height;
        if (!heightStr) return false;
        let heightInches = 0;
        if (typeof heightStr === 'number') {
          heightInches = heightStr;
        } else {
          const match = heightStr.toString().match(/(\d+)['"](\d+)/);
          if (match) {
            heightInches = parseInt(match[1]) * 12 + parseInt(match[2]);
          } else {
            heightInches = parseFloat(heightStr);
          }
        }
        if (isNaN(heightInches)) return false;
        return heightInches >= filters.height.min && heightInches <= filters.height.max;
      });
    }

    if (filters.weight && (filters.weight.min !== 100 || filters.weight.max !== 300)) {
      filtered = filtered.filter(recruit => {
        const weight = parseFloat(recruit.measurables?.weight);
        if (!weight || isNaN(weight)) return false;
        return weight >= filters.weight.min && weight <= filters.weight.max;
      });
    }

    return filtered;
  };
  
  const baseRecruits = activeView === "transfer" 
    ? recruits.filter(r => r.isTransferPortal === true)
    : recruits.filter(r => !r.isTransferPortal);
  
  const displayedRecruits = filterRecruits(baseRecruits);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[10%] w-[400px] h-[400px] bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-gradient-to-r from-purple-400/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[50%] right-[30%] w-[300px] h-[300px] bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl animate-pulse delay-500" />
        <div className="absolute top-[20%] left-[20%] w-[200px] h-[200px] bg-gradient-to-r from-indigo-400/25 to-purple-400/25 rounded-full blur-xl animate-pulse delay-700" />
      </div>

      <div className="container max-w-6xl mx-auto px-8 sm:px-12 lg:px-16 py-16">
        <div className="relative z-10 mb-6">
          <InfoBanner
            title={activeView === "transfer" ? "Transfer Portal" : "Recruiting"}
            description={activeView === "transfer" 
              ? "Track players in the transfer portal with comprehensive profiles, measurables, and coach write-ups."
              : "Track and evaluate potential recruits with comprehensive profiles, measurables, and coach write-ups."
            }
          />
        </div>

        <div className="relative z-10 mb-6">
          <div className="flex gap-2 border-b border-gray-200 mb-4">
            <button
              onClick={() => {
                setActiveView("recruiting");
                setSearchQuery("");
                setFilters({
                  tags: [],
                  schools: [],
                  years: [],
                  positions: [],
                  gpa: { min: 0, max: 4.0 },
                  exitVelocity: { min: 50, max: 120 },
                  infieldVelocity: { min: 50, max: 100 },
                  outfieldVelocity: { min: 60, max: 100 },
                  moundVelocity: { min: 60, max: 100 },
                  sixtyYardDash: { min: 5.5, max: 8.0 },
                  height: { min: 60, max: 80 },
                  weight: { min: 100, max: 300 }
                });
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeView === "recruiting"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              HS/JUCO
            </button>
            <button
              onClick={() => {
                setActiveView("transfer");
                setSearchQuery("");
                setFilters({
                  tags: [],
                  schools: [],
                  years: [],
                  positions: [],
                  gpa: { min: 0, max: 5.0 },
                  exitVelocity: { min: 50, max: 120 },
                  infieldVelocity: { min: 50, max: 100 },
                  outfieldVelocity: { min: 60, max: 100 },
                  moundVelocity: { min: 60, max: 100 },
                  sixtyYardDash: { min: 5.5, max: 8.0 },
                  height: { min: 60, max: 80 },
                  weight: { min: 100, max: 300 }
                });
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeView === "transfer"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Transfer Portal
            </button>
          </div>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className={`px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:bg-gray-50 flex items-center gap-2 ${
                (filters.tags.length > 0 || filters.schools.length > 0 || filters.years.length > 0 || filters.positions.length > 0 ||
                 (filters.gpa && (filters.gpa.min !== 0 || filters.gpa.max !== 4.0)) ||
                 (filters.exitVelocity && (filters.exitVelocity.min !== 50 || filters.exitVelocity.max !== 120)) ||
                 (filters.infieldVelocity && (filters.infieldVelocity.min !== 50 || filters.infieldVelocity.max !== 100)) ||
                 (filters.outfieldVelocity && (filters.outfieldVelocity.min !== 60 || filters.outfieldVelocity.max !== 100)) ||
                 (filters.moundVelocity && (filters.moundVelocity.min !== 60 || filters.moundVelocity.max !== 100)) ||
                 (filters.sixtyYardDash && (filters.sixtyYardDash.min !== 5.5 || filters.sixtyYardDash.max !== 8.0)) ||
                 (filters.height && (filters.height.min !== 60 || filters.height.max !== 80)) ||
                 (filters.weight && (filters.weight.min !== 100 || filters.weight.max !== 300)))
                  ? "border-blue-500 bg-blue-50"
                  : ""
              }`}
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {(() => {
                const activeFilterCount = 
                  filters.tags.length + 
                  filters.schools.length + 
                  filters.years.length +
                  filters.positions.length +
                  (filters.gpa && (filters.gpa.min !== 0 || filters.gpa.max !== 4.0) ? 1 : 0) +
                  (filters.exitVelocity && (filters.exitVelocity.min !== 50 || filters.exitVelocity.max !== 120) ? 1 : 0) +
                  (filters.infieldVelocity && (filters.infieldVelocity.min !== 50 || filters.infieldVelocity.max !== 100) ? 1 : 0) +
                  (filters.outfieldVelocity && (filters.outfieldVelocity.min !== 60 || filters.outfieldVelocity.max !== 100) ? 1 : 0) +
                  (filters.moundVelocity && (filters.moundVelocity.min !== 60 || filters.moundVelocity.max !== 100) ? 1 : 0) +
                  (filters.sixtyYardDash && (filters.sixtyYardDash.min !== 5.5 || filters.sixtyYardDash.max !== 8.0) ? 1 : 0) +
                  (filters.height && (filters.height.min !== 60 || filters.height.max !== 80) ? 1 : 0) +
                  (filters.weight && (filters.weight.min !== 100 || filters.weight.max !== 300) ? 1 : 0);
                
                return activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                );
              })()}
            </button>
          </div>
        </div>

        {displayedRecruits.length > 0 && (
          <div className="relative z-10 mb-6">
            <StatsCards recruits={displayedRecruits} />
          </div>
        )}

        <button
          onClick={() => activeView === "transfer" ? setIsTransferModalOpen(true) : setIsModalOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 hover:scale-110 flex items-center justify-center"
          title={activeView === "transfer" ? "Add Transfer Portal Player" : "Add New Recruit"}
        >
          <Plus className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          {displayedRecruits.length === 0 ? (
            <EmptyState onAddRecruit={() => activeView === "transfer" ? setIsTransferModalOpen(true) : setIsModalOpen(true)} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedRecruits.map((recruit) => (
                <RecruitCard
                  key={recruit.id}
                  recruit={recruit}
                  onEdit={handleEditRecruit}
                  onDelete={handleDeleteClick}
                  onStatusClick={handleQuickTag}
                  onViewWriteups={handleViewWriteups}
                  onAddWriteup={(recruit) => {
                    handleEditRecruit(recruit);
                    setInitialTab("writeup");
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <RecruitModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSubmit={handleModalSubmit}
          editingRecruit={editingRecruit && !editingRecruit.isTransferPortal ? editingRecruit : null}
          initialTab={initialTab}
        />

        <TransferPortalModal
          isOpen={isTransferModalOpen}
          onClose={handleTransferModalClose}
          onSubmit={handleModalSubmit}
          editingRecruit={editingRecruit && editingRecruit.isTransferPortal ? editingRecruit : null}
          initialTab={initialTab}
        />

        <WriteupsViewerModal
          isOpen={writeupsViewerData.isOpen}
          onClose={() => setWriteupsViewerData({ isOpen: false, writeups: [], playerName: '', recruitId: null })}
          writeups={writeupsViewerData.writeups}
          playerName={writeupsViewerData.playerName}
          onDeleteWriteup={handleDeleteWriteup}
        />

        <StatusDropdown
          isOpen={!!quickEditRecruit}
          position={dropdownPosition}
          recruit={currentRecruit}
          onSelect={handleQuickTagSave}
          onClose={handleQuickEditCancel}
          dropdownRef={quickEditRef}
        />

        <ConfirmDeleteModal
          isOpen={deleteConfirm.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title="Delete Recruit"
          message={`Are you sure you want to delete ${deleteConfirm.recruitName}? This action cannot be undone.`}
          loading={deleting}
        />

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          recruits={baseRecruits}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
        />

        <PasswordModal
          isOpen={isPasswordModalOpen && !hasAccess}
          onSuccess={handlePasswordSuccess}
          isSetup={isPasswordSetup}
        />
      </div>
    </div>
  );
};

export default Recruitment;
