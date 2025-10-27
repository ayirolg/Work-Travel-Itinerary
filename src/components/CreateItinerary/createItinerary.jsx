// src/components/CreateItineraryFlow.jsx
import React, { useState,useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, User, Plane, Train, Bus, Hotel, MapPin,
  Calendar, Clock, Utensils, CheckCircle, AlertCircle, X
} from 'lucide-react';


const primaryColor = '#336699';

const modeMeta = {
    flight: { label: 'Flight', Icon: Plane },
    train: { label: 'Train', Icon: Train },
    bus: { label: 'Bus', Icon: Bus },
    accommodation: { label: 'Accommodation', Icon: Hotel }
  };

const CreateItineraryFlow = () => {
    const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [travelSubType, setTravelSubType] = useState('Intra-State'); // for Domestic: Intra/Inter
  const [formData, setFormData] = useState({
    employee: {},
    travelType: '', // 'Domestic' | 'International'
    tripType: '', // 'One-way' | 'Round-trip'
    selectedModes: [], // ['flight','train',...]
    flight: null,
    train: null,
    bus: null,
    accommodation: null
  });


  // Mode currently being edited (null if not editing)
  const [currentMode, setCurrentMode] = useState(null);
  const [modeFormData, setModeFormData] = useState({});

  const token = localStorage.getItem('access_token');


   // Fetch logged-in employee details
   useEffect(() => {
    axios.get('http://localhost:8000/api/auth/employee-profile/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => setFormData(prev => ({ ...prev, employee: res.data })))
    .catch(err => console.error(err));
  }, []);

  const isoDate = (d) => d.toISOString().split('T')[0];
  // Min notice depends on travelType and subtype
  const getMinimumNotice = () => {
    if (formData.travelType === 'Domestic') {
      // support Intra/Inter
      return travelSubType === 'Intra-State' ? 3 : 5;
    }
    if (formData.travelType === 'International') return 10;
    return 3;
  };
   

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + getMinimumNotice());
    return isoDate(today);
  };


  const goToStep = (step) => {
    // allow going backwards freely; going forward only if current step valid
    if (step <= currentStep || validateCurrentStep()) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((s) => Math.min(s + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const validateCurrentStep = () => {
    // basic client-side checks
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      if (!formData.travelType || !formData.tripType) {
        window.alert('Please select travel type and trip type.');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      const transportModes = ['flight', 'train', 'bus'];
      const selectedTransportModes = formData.selectedModes.filter((m) => transportModes.includes(m));

      if (selectedTransportModes.length === 0) {
        window.alert('Please select at least one travel mode (Flight, Train, or Bus).');
        return false;
      }
      // ensure details for selected modes exist
      const allFilled = formData.selectedModes.every((m) => formData[m] !== null);
      if (!allFilled) {
        window.alert('Please add details for all selected travel modes before continuing.');
        return false;
      }
      return true;
    }
    return true;
  };

  const toggleMode = (mode) => {
    const modes = [...formData.selectedModes];
    const idx = modes.indexOf(mode);

    if (idx > -1) {
      modes.splice(idx, 1);
      // ✅ IF the removed mode is currently being edited, close the form
      if (currentMode === mode) {
        setCurrentMode(null);
        setModeFormData({});
      }
      setFormData({ ...formData, selectedModes: modes, [mode]: null });
    } else {
      modes.push(mode);
      setFormData({ ...formData, selectedModes: modes });
    }
  };

  const openModeForm = (mode) => {
    setCurrentMode(mode);
    setModeFormData(formData[mode] || {});
    // ensure UI indicates editing - we keep step at 3 and show form below
  };

  const cancelModeEdit = () => {
    setCurrentMode(null);
    setModeFormData({});
  };
    const validateModeForm = () => {
      const required = {
        flight: ['fromAirport', 'toAirport', 'travelDate'],
        train: ['fromStation', 'toStation', 'travelDate'],
        bus: ['fromCity', 'toCity', 'travelDate'],
        accommodation: ['city', 'checkIn', 'checkOut']
      };
      const fields = required[currentMode] || [];
      for (const f of fields) {
        if (!modeFormData[f]) {
          window.alert('Please fill all required fields.');
          return false;
        }
      }

      // Round-trip checks
      if (formData.tripType === 'Round-trip') {
        if (currentMode !== 'accommodation') {
          if (!modeFormData.returnDate) {
            window.alert('Please select a return date for round-trip.');
            return false;
          }
          if (modeFormData.returnDate <= modeFormData.travelDate) {
            window.alert('Return date must be after departure date.');
            return false;
          }
        } else {
          if (modeFormData.checkOut <= modeFormData.checkIn) {
            window.alert('Check-out must be after check-in.');
            return false;
          }
        }
      }

      // One-way: returnDate is optional, ignore if filled
      return true;
    };


  const saveModeData = () => {
    if (!validateModeForm()) return;
    setFormData({ ...formData, [currentMode]: { ...modeFormData } });
    setCurrentMode(null);
    setModeFormData({});
  };

   // ✅ Submit itinerary to backend
  const handleSubmit = () => {
    if (!formData.purpose) {
      window.alert("Please enter purpose of travel");
      return;
    }

    if (formData.selectedModes.length === 0) {
      window.alert("Please select at least one travel mode");
      return;
    }

    const mode = formData.selectedModes[0]; // assuming first mode for simplicity
    const data = formData[mode];

    if (!data || !data.travelDate) {
      window.alert("Please fill travel mode details");
      return;
    }

    const payload = {
      from_city: data.fromCity || data.fromStation || data.fromAirport || '',
      to_city: data.toCity || data.toStation || data.toAirport || '',
      start_date: data.travelDate,
      end_date: formData.tripType === 'Round-trip' ? data.returnDate || data.travelDate : data.travelDate,
      type: formData.travelType,
      mode: mode.charAt(0).toUpperCase() + mode.slice(1),
      purpose: formData.purpose
    };

    axios.post('http://localhost:8000/api/itineraries/', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        alert('Itinerary submitted successfully!');
        navigate('/dashboard');
      })
      .catch(err => {
        console.error(err);
        alert('Error submitting itinerary.');
      });
  };


  // Helpers for UI labels/icons
  const modeMeta = {
    flight: { label: 'Flight', Icon: Plane },
    train: { label: 'Train', Icon: Train },
    bus: { label: 'Bus', Icon: Bus },
    accommodation: { label: 'Accommodation', Icon: Hotel }
  };

  // Small layout helpers
  const cardHeaderStyle = { background: '#FFFFFF', borderBottom: `1px solid ${'#E5E7EB'}` };

  return (
    <div className="container my-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 style={{ color: primaryColor }} className="mb-0">Create Work Itinerary</h3>
          <small className="text-muted">Step {currentStep} of 4</small>
        </div>
        <div>
          <button className="btn btn-outline-secondary" onClick={() => {
                if (window.confirm('Cancel and return to dashboard?')) {
              navigate('/dashboard');
            }
            }}>
            <X size={16} className="me-1" /> Cancel
          </button>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-2">
          {[1, 2, 3, 4].map((s) => {
            const titles = {
              1: 'Employee',
              2: 'Travel Type',
              3: 'Modes',
              4: 'Review'
            };
            const isActive = currentStep === s;
            const completed = currentStep > s;
            return (
              <div key={s} className="d-flex align-items-center">
                <button
                  className={`btn btn-sm rounded-circle ${completed ? 'btn-success' : isActive ? 'btn-primary' : 'btn-light'}`}
                  onClick={() => goToStep(s)}
                  style={isActive ? { background: primaryColor, borderColor: primaryColor } : {}}
                >
                  {completed ? <Check size={14} /> : s}
                </button>
                <div className="ms-2 me-3">
                  <div style={{ fontSize: 12, color: isActive ? '#000' : '#6c757d' }}>{titles[s]}</div>
                </div>
                {s < 4 && <div style={{ width: 30, height: 2, background: currentStep > s ? '#28a745' : '#e9ecef' }}></div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Employee Details */}
      {currentStep === 1 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title" style={{ color: primaryColor }}>Employee Information</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Employee ID</label>
                <input type="text" className="form-control" value={formData.employee.employee_id} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={`${formData.employee.first_name || ''} ${formData.employee.last_name || ''}`}
                  disabled
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" value={formData.employee.department} disabled />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Designation</label>
                <input type="text" className="form-control" value={formData.employee.designation} disabled />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Band</label>
                <input type="text" className="form-control" value={formData.employee.band} disabled />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Location</label>
                <input type="text" className="form-control" value={formData.employee.location} disabled />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Contact</label>
                <input type="text" className="form-control" value={formData.employee.contact_number} disabled />
              </div>
            </div>

            <div className="alert alert-info mt-3" role="alert">
              If any employee information is incorrect, please contact HR to update your profile.
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Travel Type + Purpose */}
        {currentStep === 2 && (
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title" style={{ color: primaryColor }}>Travel Details</h5>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Travel Type *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn ${formData.travelType === 'Domestic' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setFormData({ ...formData, travelType: 'Domestic' })}
                    >
                      <MapPin className="me-2" size={14} /> Domestic
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.travelType === 'International' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setFormData({ ...formData, travelType: 'International' })}
                    >
                      <Plane className="me-2" size={14} /> International
                    </button>
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Trip Type *</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn ${formData.tripType === 'One-way' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setFormData({ ...formData, tripType: 'One-way' })}
                    >
                      One-way
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.tripType === 'Round-trip' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setFormData({ ...formData, tripType: 'Round-trip' })}
                    >
                      Round-trip
                    </button>
                  </div>
                </div>
              </div>

              {/* Domestic Intra/Inter */}
              {formData.travelType === 'Domestic' && (
                <div className="mb-3">
                  <label className="form-label">Domestic Type</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn ${travelSubType === 'Intra-State' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setTravelSubType('Intra-State')}
                    >
                      Intra-State (min 3 days)
                    </button>
                    <button
                      type="button"
                      className={`btn ${travelSubType === 'Inter-State' ? 'btn-outline-primary' : 'btn-light'}`}
                      onClick={() => setTravelSubType('Inter-State')}
                    >
                      Inter-State (min 5 days)
                    </button>
                  </div>
                </div>
              )}

              {/* Purpose */}
              <div className="mb-3">
                <label className="form-label">Purpose of Travel *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.purpose || ''}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="Enter purpose of travel"
                  required
                />
              </div>


              {formData.travelType && (
                <div className="alert alert-warning d-flex align-items-start" role="alert">
                  <AlertCircle size={18} className="me-2" />
                  <div>
                    <strong>Policy Notice:</strong> {formData.travelType} travel requires minimum {getMinimumNotice()} days advance notice. Past dates are disabled.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


      {/* Step 3: Mode Selection */}
      {currentStep === 3 && (
        <>
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h5 className="card-title" style={{ color: primaryColor }}>Select Travel Modes</h5>
              <p className="text-muted">Choose one or more modes, then add details for each selected mode.</p>

              <div className="row g-3">
                {Object.keys(modeMeta).map((mode) => {
                  const { label, Icon } = modeMeta[mode];
                  const selected = formData.selectedModes.includes(mode);
                  return (
                    <div className="col-sm-6 col-lg-3" key={mode}>
                      <div className={`card ${selected ? 'border-primary' : ''}`}>
                        <div className="card-body text-center">
                          <Icon size={32} className="mb-2" />
                          <h6>{label}</h6>
                          <div className="mt-2">
                            <button
                              className={`btn btn-sm ${selected ? 'btn-danger me-2' : 'btn-outline-primary me-2'}`}
                              onClick={() => toggleMode(mode)}
                            >
                              {selected ? 'Remove' : 'Select'}
                            </button>
                            {selected && (
                              <button className="btn btn-sm btn-primary" onClick={() => openModeForm(mode)}>
                                {formData[mode] ? 'Edit Details' : 'Add Details'}
                              </button>
                            )}
                          </div>
                          {selected && formData[mode] && (
                              <div className="mt-3 text-start small">
                                <strong>Summary:</strong>

                                {/* For Flight, Train, Bus */}
                                {['flight', 'train', 'bus'].includes(mode) && (
                                  <div>{formData[mode].travelDate ? `Date: ${formData[mode].travelDate}` : 'No date'}</div>
                                )}

                                {/* For Accommodation */}
                                {mode === 'accommodation' && (
                                  <div>
                                    {formData[mode].checkIn && formData[mode].checkOut
                                      ? `Check-in: ${formData[mode].checkIn} | Check-out: ${formData[mode].checkOut}`
                                      : 'No date'}
                                  </div>
                                )}

                                {/* From-To Details */}
                                {formData[mode].fromAirport && <div>{`From: ${formData[mode].fromAirport}`}</div>}
                              </div>
                            )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mode Form Panel - appears when currentMode is set */}
          {currentMode && (
            <div className="card mb-4 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="card-title mb-0" style={{ color: primaryColor }}>
                    {modeMeta[currentMode].label} Details
                  </h5>
                  <div>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={cancelModeEdit}><X size={14} /></button>
                    <button className="btn btn-sm btn-success" onClick={saveModeData}><Check size={14} /> Save</button>
                  </div>
                </div>

                {/* Flight */}
                {currentMode === 'flight' && (
                  <>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">From Airport *</label>
                        <input className="form-control" value={modeFormData.fromAirport || ''} onChange={(e) => setModeFormData({ ...modeFormData, fromAirport: e.target.value })} placeholder="e.g., Mumbai (BOM)" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">To Airport *</label>
                        <input className="form-control" value={modeFormData.toAirport || ''} onChange={(e) => setModeFormData({ ...modeFormData, toAirport: e.target.value })} placeholder="e.g., Delhi (DEL)" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Travel Date *</label>
                        <input type="date" className="form-control" value={modeFormData.travelDate || ''} min={getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, travelDate: e.target.value })} />
                      </div>
                      {formData.tripType === 'Round-trip' && (
                        <div className="col-md-4">
                          <label className="form-label">Return Date *</label>
                          <input
                            type="date"
                            className="form-control"
                            value={modeFormData.returnDate || ''}
                            min={modeFormData.travelDate ? isoDate(new Date(new Date(modeFormData.travelDate).getTime() + 24 * 3600 * 1000)) : getMinDate()}
                            onChange={(e) => setModeFormData({ ...modeFormData, returnDate: e.target.value })}
                          />
                        </div>
                      )}
                      <div className="col-md-4">
                        <label className="form-label">Preferred Time</label>
                        <select className="form-select" value={modeFormData.preferredTime || ''} onChange={(e) => setModeFormData({ ...modeFormData, preferredTime: e.target.value })}>
                          <option value="">Select</option>
                          <option value="Morning">Morning (6AM-12PM)</option>
                          <option value="Afternoon">Afternoon (12PM-6PM)</option>
                          <option value="Evening">Evening (6PM-12AM)</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Meal Preference</label>
                        <select className="form-select" value={modeFormData.mealPreference || ''} onChange={(e) => setModeFormData({ ...modeFormData, mealPreference: e.target.value })}>
                          <option value="">None</option>
                          <option value="Vegetarian">Vegetarian</option>
                          <option value="Non-Vegetarian">Non-Vegetarian</option>
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Cab Required?</label>
                        <select className="form-select" value={modeFormData.cabRequired || ''} onChange={(e) => setModeFormData({ ...modeFormData, cabRequired: e.target.value })}>
                          <option value="">Select</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {modeFormData.cabRequired === 'Yes' && (
                        <div className="col-12">
                          <label className="form-label">Cab Destination</label>
                          <input className="form-control" value={modeFormData.cabDestination || ''} onChange={(e) => setModeFormData({ ...modeFormData, cabDestination: e.target.value })} placeholder="Destination from airport" />
                        </div>
                      )}
                    </div>

                    <div className="alert alert-light mt-3">
                      <small><strong>Policy:</strong> Economy class only (example). Meals as per company policy.</small>
                    </div>
                  </>
                )}

                {/* Train */}
                {currentMode === 'train' && (
                  <>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">From Station *</label>
                        <input className="form-control" value={modeFormData.fromStation || ''} onChange={(e) => setModeFormData({ ...modeFormData, fromStation: e.target.value })} placeholder="e.g., Mumbai Central" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">To Station *</label>
                        <input className="form-control" value={modeFormData.toStation || ''} onChange={(e) => setModeFormData({ ...modeFormData, toStation: e.target.value })} placeholder="e.g., Delhi Junction" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Travel Date *</label>
                        <input type="date" className="form-control" value={modeFormData.travelDate || ''} min={getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, travelDate: e.target.value })} />
                      </div>
                      {formData.tripType === 'Round-trip' && (
                        <div className="col-md-4">
                          <label className="form-label">Return Date *</label>
                          <input type="date" className="form-control" value={modeFormData.returnDate || ''} min={modeFormData.travelDate ? isoDate(new Date(new Date(modeFormData.travelDate).getTime() + 24 * 3600 * 1000)) : getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, returnDate: e.target.value })} />
                        </div>
                      )}
                      <div className="col-md-4">
                        <label className="form-label">Class Preference</label>
                        <select className="form-select" value={modeFormData.classPreference || ''} onChange={(e) => setModeFormData({ ...modeFormData, classPreference: e.target.value })}>
                          <option value="">Select</option>
                          <option value="2AC">2AC</option>
                          <option value="3AC">3AC</option>
                        </select>
                      </div>
                    </div>
                    <div className="alert alert-light mt-3">
                      <small><strong>Policy:</strong> 2AC/3AC as per grade (example).</small>
                    </div>
                  </>
                )}

                {/* Bus */}
                {currentMode === 'bus' && (
                  <>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">From City *</label>
                        <input className="form-control" value={modeFormData.fromCity || ''} onChange={(e) => setModeFormData({ ...modeFormData, fromCity: e.target.value })} placeholder="e.g., Pune" />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">To City *</label>
                        <input className="form-control" value={modeFormData.toCity || ''} onChange={(e) => setModeFormData({ ...modeFormData, toCity: e.target.value })} placeholder="e.g., Mumbai" />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Travel Date *</label>
                        <input type="date" className="form-control" value={modeFormData.travelDate || ''} min={getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, travelDate: e.target.value })} />
                      </div>
                      {formData.tripType === 'Round-trip' && (
                        <div className="col-md-4">
                          <label className="form-label">Return Date *</label>
                          <input type="date" className="form-control" value={modeFormData.returnDate || ''} min={modeFormData.travelDate ? isoDate(new Date(new Date(modeFormData.travelDate).getTime() + 24 * 3600 * 1000)) : getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, returnDate: e.target.value })} />
                        </div>
                      )}
                    </div>
                    <div className="alert alert-light mt-3">
                      <small><strong>Policy:</strong> AC-equivalent buses allowed (example).</small>
                    </div>
                  </>
                )}

                {/* Accommodation */}
                {currentMode === 'accommodation' && (
                  <>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Hotel City *</label>
                        <input className="form-control" value={modeFormData.city || ''} onChange={(e) => setModeFormData({ ...modeFormData, city: e.target.value })} placeholder="e.g., Mumbai" />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Check-in *</label>
                        <input type="date" className="form-control" value={modeFormData.checkIn || ''} min={getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, checkIn: e.target.value })} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Check-out *</label>
                        <input type="date" className="form-control" value={modeFormData.checkOut || ''} min={modeFormData.checkIn ? isoDate(new Date(new Date(modeFormData.checkIn).getTime() + 24 * 3600 * 1000)) : getMinDate()} onChange={(e) => setModeFormData({ ...modeFormData, checkOut: e.target.value })} />
                      </div>
                      <div className="col-12">
                        <label className="form-label">Preferred Hotel Category</label>
                        <select className="form-select" value={modeFormData.hotelCategory || ''} onChange={(e) => setModeFormData({ ...modeFormData, hotelCategory: e.target.value })}>
                          <option value="">Select</option>
                          <option value="Standard">Standard</option>
                          <option value="Premium">Premium</option>
                        </select>
                      </div>
                    </div>
                    <div className="alert alert-light mt-3">
                      <small><strong>Policy:</strong> Hotel booking should be within allowed category as per band (example).</small>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Step 4: Review & Submit */}
      {currentStep === 4 && (
        <div className="card mb-4 shadow-sm">
          <div className="card-body">
            <h5 className="card-title" style={{ color: primaryColor }}>Review & Submit</h5>
            <p className="text-muted">Review your itinerary details below. Edit any section before final submission.</p>

            {/* Employee summary */}
            <div className="mb-3 border rounded p-3">
              <div className="d-flex justify-content-between">
                <strong>Employee</strong>
                <button className="btn btn-sm btn-link" onClick={() => goToStep(1)}>Edit</button>
              </div>
              <div className="small text-muted">
                {formData.employee.name} • {formData.employee.employeeId} • {formData.employee.designation}
              </div>
            </div>

            {/* Travel summary */}
            <div className="mb-3 border rounded p-3">
              <div className="d-flex justify-content-between">
                <strong>Travel</strong>
                <button className="btn btn-sm btn-link" onClick={() => goToStep(2)}>Edit</button>
              </div>
              <div className="small text-muted">
                Type: {formData.travelType || '-'} • Trip: {formData.tripType || '-'} {formData.travelType === 'Domestic' && `• ${travelSubType}`}
              </div>
            </div>

            {/* Modes summary */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>Selected Modes</strong>
                <span className="small text-muted">{formData.selectedModes.length} chosen</span>
              </div>

              <div className="row g-3">
                {formData.selectedModes.length === 0 && <div className="col-12 text-muted">No travel modes selected</div>}
                {formData.selectedModes.map((m) => {
                  const data = formData[m];
                  return (
                    <div className="col-md-6" key={m}>
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1">{modeMeta[m].label}</h6>
                            <div>
                              <button className="btn btn-sm btn-link" onClick={() => goToStep(3) || openModeForm(m)}>Edit</button>
                            </div>
                          </div>
                          {!data && <div className="text-muted small">No details added</div>}
                          {data && (
                            <div className="small text-muted">
                              {data.fromAirport && <div>From: {data.fromAirport}</div>}
                              {data.toAirport && <div>To: {data.toAirport}</div>}
                              {data.fromStation && <div>From: {data.fromStation}</div>}
                              {data.toStation && <div>To: {data.toStation}</div>}
                              {data.fromCity && <div>From: {data.fromCity}</div>}
                              {data.toCity && <div>To: {data.toCity}</div>}
                              {data.city && <div>City: {data.city}</div>}
                              {data.travelDate && <div>Date: {data.travelDate}</div>}
                              {data.returnDate && <div>Return: {data.returnDate}</div>}
                              {data.checkIn && <div>Check-in: {data.checkIn}</div>}
                              {data.checkOut && <div>Check-out: {data.checkOut}</div>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <div>
                <button className="btn btn-secondary" onClick={() => prevStep()}>
                  <ChevronLeft size={16} className="me-1" /> Back
                </button>
              </div>
              <div>
                <button className="btn btn-outline-secondary me-2" onClick={() => goToStep(3)}>Edit Modes</button>
                <button className="btn btn-primary" style={{ background: primaryColor, borderColor: primaryColor }} onClick={handleSubmit}>
                  Final Submit <Check className="ms-1" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation for steps */}
      <div className="d-flex justify-content-between">
        <div>
          {currentStep > 1 && <button className="btn btn-outline-secondary" onClick={prevStep}><ChevronLeft size={14} /> Back</button>}
        </div>
        <div>
          {currentStep < 4 && <button className="btn btn-primary" style={{ background: primaryColor, borderColor: primaryColor }} onClick={nextStep}>Next <ChevronRight size={14} className="ms-1" /></button>}
        </div>
      </div>
    </div>
  );
};

export default CreateItineraryFlow;
