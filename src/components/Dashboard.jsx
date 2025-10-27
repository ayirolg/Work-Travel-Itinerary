import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, ChevronDown, Plus, Edit, X, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle } from 'lucide-react';

const EmployeeDashboard = () => {
  const [itineraries, setItineraries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  
  // Get status icon and color
  const getStatusConfig = (status) => {
    const configs = {
      Approved: { badge: 'badge bg-success-subtle text-success-emphasis border border-success-subtle', icon: CheckCircle },
      Pending: { badge: 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle', icon: Clock },
      Rejected: { badge: 'badge bg-danger-subtle text-danger-emphasis border border-danger-subtle', icon: XCircle },
      Completed: { badge: 'badge bg-primary-subtle text-primary-emphasis border border-primary-subtle', icon: CheckCircle },
      Withdrawn: { badge: 'badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle', icon: AlertTriangle },
    };
    return configs[status] || configs.Pending;
  };


  const handleLogout = async () => {
      const refresh_token = localStorage.getItem('refresh_token');
      const access_token = localStorage.getItem('access_token');
      
      console.log('Refresh Token:', refresh_token);
      console.log('Access Token:', access_token);

      if (!refresh_token) {
        alert('No refresh token found in localStorage');
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/auth/logout/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
        });

        console.log('Response status:', res.status);

        const data = await res.json();
        console.log('Response data:', data);

        if (!res.ok) throw new Error(data.error || 'Logout failed');

        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        navigate('/');
      } catch (err) {
        console.error('Logout error:', err);
        alert(err.message || 'Logout error');
      }
    };



  // Priority order for sorting
  const getPriority = (item) => {
    const today = new Date();
    const travelDate = new Date(item.start_date);
    const isUpcoming = travelDate >= today;

    if (item.status === 'Approved' && isUpcoming) return 1;
    if (item.status === 'Pending' && isUpcoming) return 2;
    if (item.status === 'Approved' && !isUpcoming) return 3;
    if (item.status === 'Completed') return 3;
    if (item.status === 'Withdrawn') return 5;
    if (item.status === 'Rejected' && isUpcoming) return 4;
    if (item.status === 'Rejected' && !isUpcoming) return 5;
    return 6;
  };

  // Fetch itineraries from backend
  const fetchItineraries = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/itineraries/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load itineraries');
      const data = await res.json();
      setItineraries(data.results || data);
    } catch (e) {
      setError(e.message || 'Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItineraries();
  }, []);

  // Withdraw itinerary (PATCH)
  const withdrawItinerary = async (id) => {
    const token = localStorage.getItem('access_token');
    try {
      const res = await fetch(`http://localhost:8000/api/itineraries/${id}/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Withdrawn' }),
      });
      if (!res.ok) throw new Error('Failed to withdraw itinerary');
      const updated = await res.json();
      setItineraries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err) {
      alert(err.message || 'Error withdrawing itinerary');
    }
  };

  // Filter and sort itineraries
  const filteredAndSortedItineraries = useMemo(() => {
    let filtered = itineraries;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.to_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(item.id).includes(searchTerm)
      );
    }

    if (filterStatus !== 'All') filtered = filtered.filter((item) => item.status === filterStatus);
    if (filterType !== 'All') filtered = filtered.filter((item) => item.type === filterType);

    const sorted = [...filtered];
    switch (sortBy) {
      case 'recent':
        sorted.sort((a, b) => new Date(b.request_date) - new Date(a.request_date));
        break;
      case 'travelDate':
        sorted.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        break;
      case 'priority':
        sorted.sort((a, b) => getPriority(a) - getPriority(b));
        break;
      default:
        break;
    }

    return sorted;
  }, [itineraries, searchTerm, filterStatus, filterType, sortBy]);

  const isTravelDatePassed = (date) => new Date(date) < new Date();
  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-white border-bottom">
        <div className="container py-3 d-flex align-items-center justify-content-between">
          <div>
            <h1 className="h4 fw-bold" style={{ color: '#336699' }}>
              My Travel Itineraries
            </h1>
            <p className="text-muted small mb-0">Manage your work travel requests</p>
          </div>
        
          <div>
            <button
              className="btn text-white me-2"
              style={{ backgroundColor: '#336699' }}
              onClick={() => navigate('/create-itinerary')}
            >
              <Plus size={18} className="me-2" /> Create Work Itinerary
            </button>

            <button
              className="btn btn-outline-danger"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container py-4">
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-lg">
                <div className="position-relative">
                  <Search className="position-absolute" style={{ left: 10, top: 10 }} size={18} color="#6c757d" />
                  <input
                    type="text"
                    className="form-control ps-5"
                    placeholder="Search by destination, purpose, or request ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-auto">
                <button className="btn btn-outline-secondary d-flex align-items-center" onClick={() => setShowFilters(!showFilters)}>
                  <Filter size={18} className="me-2" /> Filters <ChevronDown size={16} className={`ms-1 ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="col-auto">
                <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="recent">Sort: Most Recent</option>
                  <option value="travelDate">Sort: Travel Date</option>
                  <option value="priority">Sort: Priority</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div className="pt-3 mt-3 border-top">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label small">Status</label>
                    <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="All">All Status</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small">Type</label>
                    <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                      <option value="All">All Types</option>
                      <option value="Domestic">Domestic</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setFilterStatus('All');
                        setFilterType('All');
                        setSearchTerm('');
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-start">
            <AlertCircle className="me-2 mt-1" size={18} /> <span className="small">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5 text-muted">Loading itineraries...</div>
        ) : (
          <div className="row g-4">
            {filteredAndSortedItineraries.length === 0 ? (
              <div className="text-center py-5">
                <AlertCircle size={48} className="text-muted mb-3" />
                <h6 className="mb-1">No itineraries found</h6>
                <p className="text-muted small mb-0">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              filteredAndSortedItineraries.map((item) => {
                const { badge, icon: StatusIcon } = getStatusConfig(item.status);
                const canEdit = !isTravelDatePassed(item.start_date) && item.status !== 'Completed' && item.status !== 'Withdrawn';
                return (
                  <div className="col-12 col-md-6 col-lg-4" key={item.id}>
                    <div className="card h-100 shadow-sm border-0">
                      <div className="card-body border-bottom">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="me-2">
                            <div className="d-flex align-items-center text-muted small mb-1">
                              <MapPin size={16} className="me-1" /> Request #{item.id}
                            </div>
                            <h5 className="card-title mb-0">
                              {item.from_city} → {item.to_city}
                            </h5>
                          </div>
                          <span className={badge}>{item.type}</span>
                        </div>
                        <div className="d-flex align-items-center text-muted small">
                          <Calendar size={16} className="me-2" /> {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </div>
                      <div className="card-body">
                        <div className="d-flex justify-content-between small mb-2">
                          <span className="text-muted">Mode:</span>
                          <span className="fw-semibold">{item.mode}</span>
                        </div>
                        <div className="d-flex justify-content-between small mb-3">
                          <span className="text-muted">Purpose:</span>
                          <span className="fw-semibold">{item.purpose}</span>
                        </div>
                        <div className={`d-inline-flex align-items-center gap-2 rounded px-2 py-1`}>
                          <StatusIcon size={18} /> <span className="small fw-semibold">{item.status}</span>
                        </div>
                      </div>
                      {canEdit && (
                        <div className="card-footer bg-white border-0 d-flex gap-2">
                          {/* <button
                            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
                            onClick={() => alert(`Edit itinerary #${item.id}`)}
                          >
                            <Edit size={16} className="me-2" /> Edit
                          </button> */}
                          <button
                            className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
                            onClick={() => withdrawItinerary(item.id)}
                          >
                            <X size={16} className="me-2" /> Withdraw
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
