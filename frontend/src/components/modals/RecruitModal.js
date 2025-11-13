import React, { useState, useEffect } from "react";
import { User, Activity, FileText, Save, X, Plus, Trash2 } from "lucide-react";
import Modal from "./Modal";
import { formatPhoneNumber, handleNumberInput, getGradeName } from "../../utils/recruitFormUtils";

const RecruitModal = ({ isOpen, onClose, onSubmit, editingRecruit = null, initialTab = "info" }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    name: "",
    highSchool: "",
    positions: [],
    bats: "",
    throws: "",
    gpa: "",
    phone: "",
    email: "",
    socialMedia: {
      twitter: "",
      instagram: "",
    },
    measurables: {
      exitVelocity: "",
      infieldVelocity: "",
      outfieldVelocity: "",
      moundVelocity: "",
      sixtyYardDash: "",
      height: "",
      weight: "",
    },
    coachWriteUps: [],
    newWriteUp: "",
    newCoachName: "",
    newToolGrades: {
      hitting: "",
      power: "",
      running: "",
      fielding: "",
      armStrength: "",
    },
    datesSeen: [],
    tag: "",
    graduationYear: "",
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (editingRecruit) {
      setFormData({
        name: editingRecruit.name || "",
        highSchool: editingRecruit.highSchool || "",
        positions: editingRecruit.positions || [],
        bats: editingRecruit.bats || "",
        throws: editingRecruit.throws || "",
        gpa: editingRecruit.gpa || "",
        phone: editingRecruit.phone || "",
        email: editingRecruit.email || "",
    socialMedia: {
          twitter: editingRecruit.socialMedia?.twitter || "",
          instagram: editingRecruit.socialMedia?.instagram || "",
    },
    measurables: {
          exitVelocity: editingRecruit.measurables?.exitVelocity || "",
          infieldVelocity: editingRecruit.measurables?.infieldVelocity || "",
          outfieldVelocity: editingRecruit.measurables?.outfieldVelocity || "",
          moundVelocity: editingRecruit.measurables?.moundVelocity || "",
          sixtyYardDash: editingRecruit.measurables?.sixtyYardDash || "",
          height: editingRecruit.measurables?.height || "",
          weight: editingRecruit.measurables?.weight || "",
    },
        coachWriteUps: editingRecruit.coachWriteUps || [],
        newWriteUp: "",
        newCoachName: "",
        newToolGrades: {
          hitting: "",
          power: "",
          running: "",
          fielding: "",
          armStrength: "",
        },
        datesSeen: editingRecruit.datesSeen || (editingRecruit.dateSeen ? [{ date: editingRecruit.dateSeen, tag: "" }] : []),
        tag: editingRecruit.tag || "",
        graduationYear: editingRecruit.graduationYear || "",
  });
    } else {
      resetForm();
    }
  }, [editingRecruit]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      highSchool: "",
      positions: [],
      bats: "",
      throws: "",
      gpa: "",
      phone: "",
      email: "",
      socialMedia: {
        twitter: "",
        instagram: "",
      },
      measurables: {
        exitVelocity: "",
        infieldVelocity: "",
        outfieldVelocity: "",
        moundVelocity: "",
        sixtyYardDash: "",
        height: "",
        weight: "",
      },
      coachWriteUps: [],
      newWriteUp: "",
      newCoachName: "",
      newToolGrades: {
        hitting: "",
        power: "",
        running: "",
        fielding: "",
        armStrength: "",
      },
      datesSeen: [],
      tag: "",
      graduationYear: "",
    });
    setActiveTab("info");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!formData.name.trim()) {
      setError("Player name is required.");
      setActiveTab("info");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const updatedWriteUps = [...formData.coachWriteUps];
      if (formData.newWriteUp.trim() && formData.newCoachName.trim()) {
        updatedWriteUps.push({
          content: formData.newWriteUp.trim(),
          coachName: formData.newCoachName.trim(),
          date: new Date().toISOString(),
          toolGrades: {
            hitting: formData.newToolGrades.hitting ? parseInt(formData.newToolGrades.hitting) : null,
            power: formData.newToolGrades.power ? parseInt(formData.newToolGrades.power) : null,
            running: formData.newToolGrades.running ? parseInt(formData.newToolGrades.running) : null,
            fielding: formData.newToolGrades.fielding ? parseInt(formData.newToolGrades.fielding) : null,
            armStrength: formData.newToolGrades.armStrength ? parseInt(formData.newToolGrades.armStrength) : null,
          },
        });
      }

      const { newWriteUp, newCoachName, newToolGrades, coachWriteUp, coachName, ...formDataWithoutExtras } = formData;

      const twitterHandle = formData.socialMedia.twitter.trim();
      const twitterValue = twitterHandle && !twitterHandle.startsWith('@') ? `@${twitterHandle}` : twitterHandle;

      const instagramHandle = formData.socialMedia.instagram.trim();
      const instagramValue = instagramHandle && !instagramHandle.startsWith('@') ? `@${instagramHandle}` : instagramHandle;

      const recruitData = {
        ...formDataWithoutExtras,
        name: formData.name.trim(),
        highSchool: formData.highSchool.trim(),
        bats: formData.bats.trim() || null,
        throws: formData.throws.trim() || null,
        gpa: formData.gpa ? parseFloat(formData.gpa) : null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        socialMedia: {
          twitter: twitterValue || null,
          instagram: instagramValue || null,
        },
        datesSeen: formData.datesSeen.filter(d => d.date),
        coachWriteUps: updatedWriteUps,
        measurables: {
          ...formData.measurables,
          exitVelocity: formData.measurables.exitVelocity ? parseFloat(formData.measurables.exitVelocity) : null,
          infieldVelocity: formData.measurables.infieldVelocity ? parseFloat(formData.measurables.infieldVelocity) : null,
          outfieldVelocity: formData.measurables.outfieldVelocity ? parseFloat(formData.measurables.outfieldVelocity) : null,
          moundVelocity: formData.measurables.moundVelocity ? parseFloat(formData.measurables.moundVelocity) : null,
          sixtyYardDash: formData.measurables.sixtyYardDash ? parseFloat(formData.measurables.sixtyYardDash) : null,
          height: formData.measurables.height ? parseFloat(formData.measurables.height) : null,
          weight: formData.measurables.weight ? parseFloat(formData.measurables.weight) : null,
        },
      };

      await onSubmit(recruitData);
      handleClose();
    } catch (err) {
      setError(err?.message || "Failed to save recruit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePositionChange = (position, checked) => {
    setFormData(prev => ({
      ...prev,
      positions: checked
        ? [...prev.positions, position]
        : prev.positions.filter(p => p !== position)
    }));
  };

  const addDateSeen = () => {
    setFormData(prev => ({
      ...prev,
      datesSeen: [...prev.datesSeen, { date: "", tag: "" }]
    }));
  };

  const removeDateSeen = (index) => {
    setFormData(prev => ({
      ...prev,
      datesSeen: prev.datesSeen.filter((_, i) => i !== index)
    }));
  };

  const updateDateSeen = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      datesSeen: prev.datesSeen.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setFormData(prev => ({ ...prev, phone: formatPhoneNumber(value) }));
    }
  };

  const handleToolGradeChange = (tool, value) => {
    setFormData(prev => ({
      ...prev,
      newToolGrades: { ...prev.newToolGrades, [tool]: value }
    }));
  };

  const tabs = [
    { id: "info", label: "Player Info", icon: User },
    { id: "measurables", label: "Measurables", icon: Activity },
    { id: "writeup", label: "Coach Write-Up", icon: FileText },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Player Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">High School</label>
              <input
                type="text"
                value={formData.highSchool}
                onChange={(e) => setFormData(prev => ({ ...prev, highSchool: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Positions</label>
              <div className="grid grid-cols-3 gap-2">
                {["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "P", "DH"].map((position) => (
                  <label key={position} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.positions.includes(position)}
                      onChange={(e) => handlePositionChange(position, e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {position}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Bats</label>
                <div className="flex gap-2">
                  {['L', 'R', 'S'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bats: prev.bats === option ? '' : option }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.bats === option
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Throws</label>
                <div className="flex gap-2">
                  {['L', 'R', 'S'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, throws: prev.throws === option ? '' : option }))}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.throws === option
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">GPA</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.gpa}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value, true);
                  if (value !== null) {
                    setFormData(prev => ({ ...prev, gpa: value }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Graduation Year</label>
              <select
                value={formData.graduationYear}
                onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              >
                <option value="">Select year</option>
                {Array.from({ length: 10 }, (_, i) => 2025 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Email</label>
                <input
                  type="email"
                  inputMode="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Recruitment Status</label>
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Status</label>
                <select
                  value={formData.tag}
                  onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                >
                  <option value="">No status</option>
                  <option value="potential-offer">Potential Offer</option>
                  <option value="unscouted">Unscouted</option>
                  <option value="offer-given">Offer Given</option>
                  <option value="unsure">Unsure</option>
                  <option value="high-interest">High Interest</option>
                  <option value="committed">Committed</option>
                  <option value="not-interested">Not Interested</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900">Dates Seen</label>
                <button
                  type="button"
                  onClick={addDateSeen}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Add Date
                </button>
              </div>
              <div className="space-y-2">
                {formData.datesSeen.map((dateSeen, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input
                      type="date"
                      value={dateSeen.date || ''}
                      onChange={(e) => updateDateSeen(index, 'date', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                    />
                    <select
                      value={dateSeen.tag || ''}
                      onChange={(e) => updateDateSeen(index, 'tag', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                    >
                      <option value="">No tag</option>
                      <option value="showcase">Showcase</option>
                      <option value="game">Game</option>
                      <option value="in-person-visit">In Person Visit</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeDateSeen(index)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {formData.datesSeen.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No dates added yet</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Social Media</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Twitter</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm">@</span>
                <input
                  type="text"
                      value={formData.socialMedia.twitter.replace(/^@/, '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/^@/g, '');
                        setFormData(prev => ({
                    ...prev,
                          socialMedia: { ...prev.socialMedia, twitter: value }
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Instagram</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-600 text-sm">@</span>
                <input
                  type="text"
                      value={formData.socialMedia.instagram.replace(/^@/, '')}
                      onChange={(e) => {
                        const value = e.target.value.replace(/^@/g, '');
                        setFormData(prev => ({
                    ...prev,
                          socialMedia: { ...prev.socialMedia, instagram: value }
                        }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "measurables":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Height (inches)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.measurables.height}
                  onChange={(e) => {
                    const value = handleNumberInput(e.target.value, true);
                    if (value !== null) {
                      setFormData(prev => ({
                    ...prev,
                        measurables: { ...prev.measurables, height: value }
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Weight (lbs)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.measurables.weight}
                  onChange={(e) => {
                    const value = handleNumberInput(e.target.value);
                    if (value !== null) {
                      setFormData(prev => ({
                    ...prev,
                        measurables: { ...prev.measurables, weight: value }
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">60 Yard Dash (seconds)</label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.measurables.sixtyYardDash}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value, true);
                  if (value !== null) {
                    setFormData(prev => ({
                  ...prev,
                      measurables: { ...prev.measurables, sixtyYardDash: value }
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Exit Velocity (mph)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.measurables.exitVelocity}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value);
                  if (value !== null) {
                    setFormData(prev => ({
                  ...prev,
                      measurables: { ...prev.measurables, exitVelocity: value }
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Infield Velocity (mph)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.measurables.infieldVelocity}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value);
                  if (value !== null) {
                    setFormData(prev => ({
                  ...prev,
                      measurables: { ...prev.measurables, infieldVelocity: value }
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Outfield Velocity (mph)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.measurables.outfieldVelocity}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value);
                  if (value !== null) {
                    setFormData(prev => ({
                      ...prev,
                      measurables: { ...prev.measurables, outfieldVelocity: value }
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1.5">Mound Velocity (mph)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.measurables.moundVelocity}
                onChange={(e) => {
                  const value = handleNumberInput(e.target.value);
                  if (value !== null) {
                    setFormData(prev => ({
                  ...prev,
                      measurables: { ...prev.measurables, moundVelocity: value }
                    }));
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

          </div>
        );

      case "writeup":
        return (
          <div className="space-y-6">
            {formData.coachWriteUps && formData.coachWriteUps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Existing Write-Ups ({formData.coachWriteUps.length})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {formData.coachWriteUps.map((writeup, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{writeup.coachName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(writeup.date).toLocaleDateString()}
                        </span>
                      </div>
                      {writeup.toolGrades && (writeup.toolGrades.hitting || writeup.toolGrades.power || writeup.toolGrades.running || writeup.toolGrades.fielding || writeup.toolGrades.armStrength) && (
                        <div className="mb-2 pb-2 border-b border-gray-200">
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            {writeup.toolGrades.hitting && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hitting:</span>
                                <span className="font-medium text-gray-900">{writeup.toolGrades.hitting} - {getGradeName(writeup.toolGrades.hitting)}</span>
                              </div>
                            )}
                            {writeup.toolGrades.power && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Power:</span>
                                <span className="font-medium text-gray-900">{writeup.toolGrades.power} - {getGradeName(writeup.toolGrades.power)}</span>
                              </div>
                            )}
                            {writeup.toolGrades.running && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Running:</span>
                                <span className="font-medium text-gray-900">{writeup.toolGrades.running} - {getGradeName(writeup.toolGrades.running)}</span>
                              </div>
                            )}
                            {writeup.toolGrades.fielding && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Fielding:</span>
                                <span className="font-medium text-gray-900">{writeup.toolGrades.fielding} - {getGradeName(writeup.toolGrades.fielding)}</span>
                              </div>
                            )}
                            {writeup.toolGrades.armStrength && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Arm Strength:</span>
                                <span className="font-medium text-gray-900">{writeup.toolGrades.armStrength} - {getGradeName(writeup.toolGrades.armStrength)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-gray-700">{writeup.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Add New Write-Up</h4>
              <div className="space-y-3">
            <div>
                  <label className="block text-xs text-gray-600 mb-1">Coach Name</label>
              <input
                type="text"
                    value={formData.newCoachName}
                    onChange={(e) => setFormData(prev => ({ ...prev, newCoachName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
              />
            </div>

            <div>
                  <label className="block text-xs text-gray-600 mb-1">Write-Up</label>
              <textarea
                    value={formData.newWriteUp}
                    onChange={(e) => setFormData(prev => ({ ...prev, newWriteUp: e.target.value }))}
                    rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 resize-none text-sm"
              />
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <label className="block text-xs text-gray-600 mb-2">Tool Grades (20-80 Scale)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'hitting', label: 'Hitting' },
                      { key: 'power', label: 'Power' },
                      { key: 'running', label: 'Running' },
                      { key: 'fielding', label: 'Fielding' },
                      { key: 'armStrength', label: 'Arm Strength' }
                    ].map((tool) => (
                      <div key={tool.key}>
                        <label className="block text-xs text-gray-500 mb-1">{tool.label}</label>
                        <select
                          value={formData.newToolGrades[tool.key]}
                          onChange={(e) => handleToolGradeChange(tool.key, e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-sm"
                        >
                          <option value="">-</option>
                          {[20, 30, 40, 45, 50, 55, 60, 70, 80].map(grade => (
                            <option key={grade} value={grade}>{grade} - {getGradeName(grade)}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editingRecruit ? "Edit Recruit" : "Add New Recruit"}>
      <div className="space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderTabContent()}

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Recruit"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RecruitModal;

