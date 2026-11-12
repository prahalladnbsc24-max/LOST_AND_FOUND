
import { useEffect, useState } from 'react'
import {
  Search, Plus, LayoutDashboard, Package, LogOut,
  Bell, MapPin, CalendarDays, ArrowRight, X,
  AlertCircle, CheckCircle2, LoaderCircle, ShieldCheck,
  ImagePlus, Pencil, Trash2, ClipboardList, TriangleAlert
} from 'lucide-react'
import { api } from './services/api'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lf_user')) || null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('lf_token') || '')
  const [page, setPage] = useState('dashboard')
  const [authMode, setAuthMode] = useState('login')
  const [items, setItems] = useState([])
  const [myItems, setMyItems] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  })

  const emptyItemForm = {
    name: '',
    category: 'Electronics',
    type: 'Lost',
    location: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    status: 'Open'
  }

  const [itemForm, setItemForm] = useState(emptyItemForm)

  // ================= LOAD ITEMS =================

  async function loadItems() {
    try {
      const data = await api.getItems()
      setItems(data.items || [])
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadMyItems() {
    if (!token) return

    try {
      const data = await api.getMyItems(token)
      setMyItems(data.items || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadItems()
  }, [])

  // ================= AUTHENTICATION =================

  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const data = authMode === 'login'
        ? await api.login({
            email: authForm.email,
            password: authForm.password
          })
        : await api.register(authForm)

      if (authMode === 'register') {
        setMessage('Account created! Please log in.')
        setAuthMode('login')
        setAuthForm({
          name: '',
          email: authForm.email,
          password: ''
        })
      } else {
        localStorage.setItem('lf_token', data.token)
        localStorage.setItem('lf_user', JSON.stringify(data.user))

        setToken(data.token)
        setUser(data.user)
        setMessage('Welcome to Findora!')

        await loadItems()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('lf_token')
    localStorage.removeItem('lf_user')

    setToken('')
    setUser(null)
    setMyItems([])
    setPage('dashboard')
    setMessage('You have been logged out.')
  }

  // ================= IMAGE HANDLING =================

  function handleImageChange(e) {
    const file = e.target.files?.[0]

    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG or WEBP image.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.')
      e.target.value = ''
      return
    }

    setError('')
    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function openNewReport() {
    setEditingId(null)
    setItemForm({ ...emptyItemForm })
    setSelectedImage(null)
    setImagePreview('')
    setError('')
    setShowForm(true)
  }

  function openEditReport(item) {
    setEditingId(item._id)

    setItemForm({
      name: item.name || '',
      category: item.category || 'Electronics',
      type: item.type || 'Lost',
      location: item.location || '',
      date: item.date
        ? new Date(item.date).toISOString().slice(0, 10)
        : '',
      description: item.description || '',
      status: item.status || 'Open'
    })

    setSelectedImage(null)
    setImagePreview(item.image ? `${API_URL}${item.image}` : '')
    setError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setSelectedImage(null)
    setImagePreview('')
    setItemForm({ ...emptyItemForm })
  }

  // ================= CREATE / UPDATE REPORT =================

  async function handleSaveItem(e) {
    e.preventDefault()

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const formData = new FormData()

      Object.entries(itemForm).forEach(([key, value]) => {
        formData.append(key, value)
      })

      if (selectedImage) {
        formData.append('image', selectedImage)
      }

      if (editingId) {
        await api.updateItem(editingId, formData, token)
        setMessage('Your report has been updated!')
      } else {
        await api.createItem(formData, token)
        setMessage('Your report has been published!')
      }

      closeForm()

      await loadItems()
      await loadMyItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ================= DELETE REPORT =================

  function openDeleteConfirmation(item) {
    setDeleteTarget(item)
  }

  function closeDeleteConfirmation() {
    if (!loading) {
      setDeleteTarget(null)
    }
  }

  async function handleDeleteItem() {
    if (!deleteTarget || loading) return

    setLoading(true)
    setError('')

    try {
      await api.deleteItem(deleteTarget._id, token)

      setDeleteTarget(null)
      setMessage('Report deleted successfully!')

      await loadItems()
      await loadMyItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ================= FILTER ITEMS =================

  const sourceItems = page === 'mine' ? myItems : items

  const visibleItems = sourceItems.filter(item => {
    const matchesSearch = [
      item.name,
      item.description,
      item.location,
      item.category
    ].join(' ').toLowerCase().includes(search.toLowerCase())

    const matchesFilter = filter === 'All' || item.type === filter

    return matchesSearch && matchesFilter
  })

  const lostCount = items.filter(item => item.type === 'Lost').length
  const foundCount = items.filter(item => item.type === 'Found').length

  // ================= IMAGE URL =================

  function getImageUrl(image) {
    if (!image) return ''

    return image.startsWith('http')
      ? image
      : `${API_URL}${image}`
  }

  // ================= AUTH PAGE =================

  if (!user) {
    return (
      <main className="auth-page">
        <div className="auth-glow glow-one" />
        <div className="auth-glow glow-two" />

        <div className="auth-brand">
          <div className="brand-icon">F</div>
          <span>findora<span className="brand-dot">.</span></span>
        </div>

        <section className="auth-card">
          <div className="auth-heading">
            <span className="eyebrow">CAMPUS LOST & FOUND PLATFORM</span>
            <h1>{authMode === 'login' ? 'Welcome back.' : 'Join Findora.'}</h1>
            <p>
              {authMode === 'login'
                ? 'Sign in to reconnect people with their belongings.'
                : 'Create your account and make campus a better place.'}
            </p>
          </div>

          {error && (
            <div className="alert error">
              <AlertCircle size={17} />{error}
            </div>
          )}

          {message && (
            <div className="alert success">
              <CheckCircle2 size={17} />{message}
            </div>
          )}

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === 'register' && (
              <label>
                Full name
                <input
                  required
                  placeholder="Enter your full name"
                  value={authForm.name}
                  onChange={e => setAuthForm({
                    ...authForm,
                    name: e.target.value
                  })}
                />
              </label>
            )}

            <label>
              Email address
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={authForm.email}
                onChange={e => setAuthForm({
                  ...authForm,
                  email: e.target.value
                })}
              />
            </label>

            <label>
              Password
              <input
                required
                minLength="8"
                type="password"
                placeholder="At least 8 characters"
                value={authForm.password}
                onChange={e => setAuthForm({
                  ...authForm,
                  password: e.target.value
                })}
              />
            </label>

            <button className="primary-button full-button" disabled={loading}>
              {loading
                ? <LoaderCircle className="spin" size={18} />
                : authMode === 'login' ? 'Sign in' : 'Create account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="auth-switch">
            {authMode === 'login'
              ? "Don't have an account?"
              : 'Already registered?'}

            <button onClick={() => {
              setAuthMode(authMode === 'login' ? 'register' : 'login')
              setError('')
              setMessage('')
            }}>
              {authMode === 'login' ? 'Create account' : 'Sign in'}
            </button>
          </div>

          <div className="auth-security">
            <ShieldCheck size={16} />
            Your account is protected with secure authentication.
          </div>
        </section>

        <p className="auth-footer">
          © 2026 Findora · Reuniting people with their belongings.
        </p>
      </main>
    )
  }

  // ================= MAIN DASHBOARD =================

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">F</div>
          <span>findora<span className="brand-dot">.</span></span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <button
          className={`nav-link ${page === 'dashboard' ? 'active' : ''}`}
          onClick={() => setPage('dashboard')}
        >
          <LayoutDashboard size={19} /> Dashboard
        </button>

        <button
          className={`nav-link ${page === 'items' ? 'active' : ''}`}
          onClick={() => {
            setPage('items')
            loadItems()
          }}
        >
          <Package size={19} /> Browse items
        </button>

        <button
          className={`nav-link ${page === 'mine' ? 'active' : ''}`}
          onClick={() => {
            setPage('mine')
            loadMyItems()
          }}
        >
          <ClipboardList size={19} /> My Reports
        </button>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>

            <div className="user-mini-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
          </div>

          <button className="nav-link logout-link" onClick={logout}>
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">CAMPUS COMMUNITY</span>
            <h2>
              {page === 'dashboard'
                ? 'Dashboard'
                : page === 'mine'
                  ? 'My Reports'
                  : 'Explore items'}
            </h2>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications">
              <Bell size={19} />
            </button>
            <div className="topbar-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {error && (
          <div className="alert error">
            <AlertCircle size={17} />{error}
            <button onClick={() => setError('')}><X size={15} /></button>
          </div>
        )}

        {message && (
          <div className="alert success">
            <CheckCircle2 size={17} />{message}
            <button onClick={() => setMessage('')}><X size={15} /></button>
          </div>
        )}

        {page === 'dashboard' && (
          <>
            <section className="welcome-banner">
              <div>
                <span className="eyebrow light-eyebrow">
                  YOUR CAMPUS, CONNECTED
                </span>
                <h1>Hello, {user.name?.split(' ')[0]} 👋</h1>
                <p>Let's help lost belongings find their way home.</p>

                <button className="banner-button" onClick={openNewReport}>
                  <Plus size={18} /> Report an item
                </button>
              </div>

              <div className="banner-decoration">F</div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple"><Package size={20} /></div>
                <span>Total open reports</span>
                <strong>{items.length}</strong>
                <small>Active listings</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange"><Search size={20} /></div>
                <span>Lost items</span>
                <strong>{lostCount}</strong>
                <small>Waiting to be found</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green"><CheckCircle2 size={20} /></div>
                <span>Found items</span>
                <strong>{foundCount}</strong>
                <small>Waiting for their owners</small>
              </div>
            </section>
          </>
        )}

        <section className="items-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                {page === 'mine' ? 'YOUR ACTIVITY' : 'COMMUNITY LISTINGS'}
              </span>
              <h2>
                {page === 'dashboard'
                  ? 'Recent reports'
                  : page === 'mine'
                    ? 'Reports submitted by you'
                    : 'Browse all items'}
              </h2>
            </div>

            {page !== 'mine' && (
              <button className="text-button" onClick={() => setPage('items')}>
                View all <ArrowRight size={16} />
              </button>
            )}

            {page === 'mine' && (
              <button className="text-button" onClick={openNewReport}>
                <Plus size={16} /> New report
              </button>
            )}
          </div>

          <div className="listing-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                placeholder="Search items, locations, categories..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option>All</option>
              <option>Lost</option>
              <option>Found</option>
            </select>
          </div>

          <div className="items-grid">
            {visibleItems.length === 0 ? (
              <div className="empty-state">
                <Package size={38} />
                <h3>No reports found</h3>
                <p>
                  {page === 'mine'
                    ? "You haven't submitted any reports yet."
                    : 'Try another search or be the first to report an item.'}
                </p>

                <button className="primary-button" onClick={openNewReport}>
                  <Plus size={17} /> Report an item
                </button>
              </div>
            ) : (
              visibleItems.map(item => (
                <article className="item-card" key={item._id}>
                  <div className="item-card-top">
                    <span className={`item-type ${item.type.toLowerCase()}`}>
                      {item.type}
                    </span>
                    <span className="item-category">{item.category}</span>
                  </div>

                  {item.image ? (
                    <img
                      className="item-photo"
                      src={getImageUrl(item.image)}
                      alt={item.name}
                    />
                  ) : (
                    <div className="item-symbol">
                      <Package size={27} />
                    </div>
                  )}

                  <h3>{item.name}</h3>
                  <p className="item-description">{item.description}</p>

                  <div className="item-meta">
                    <span><MapPin size={15} />{item.location}</span>
                    <span>
                      <CalendarDays size={15} />
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="item-card-footer">
                    <span>
                      Reported by {item.owner?.name || 'Campus member'}
                    </span>
                    <span className="open-status">{item.status || 'Open'}</span>
                  </div>

                  {page === 'mine' && (
                    <div className="report-actions">
                      <button
                        className="edit-report-button"
                        onClick={() => openEditReport(item)}
                      >
                        <Pencil size={15} /> Edit
                      </button>

                      <button
                        className="delete-report-button"
                        onClick={() => openDeleteConfirmation(item)}
                      >
                        <Trash2 size={15} /> Delete
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      {/* ================= CUSTOM DELETE CONFIRMATION ================= */}

      {deleteTarget && (
        <div
          className="modal-backdrop"
          onClick={closeDeleteConfirmation}
        >
          <section
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="delete-warning-icon">
              <TriangleAlert size={27} />
            </div>

            <span className="eyebrow">CONFIRMATION REQUIRED</span>

            <h2 id="delete-title">Delete this report?</h2>

            <p>
              Are you sure you want to delete
              <strong> "{deleteTarget.name}"</strong>?
              This action cannot be undone.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="cancel-delete-button"
                onClick={closeDeleteConfirmation}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleDeleteItem}
                disabled={loading}
              >
                {loading
                  ? 'Deleting...'
                  : <><Trash2 size={15} /> Delete permanently</>}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ================= REPORT MODAL ================= */}

      {showForm && (
        <div className="modal-backdrop" onClick={closeForm}>
          <section
            className="report-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <span className="eyebrow">COMMUNITY REPORT</span>
                <h2>{editingId ? 'Edit your report' : 'Report an item'}</h2>
                <p>
                  Share the details so the right person can find it.
                </p>
              </div>

              <button className="icon-button" onClick={closeForm}>
                <X />
              </button>
            </div>

            <form className="report-form" onSubmit={handleSaveItem}>
              <label>
                Item name
                <input
                  required
                  placeholder="e.g. Black wallet"
                  value={itemForm.name}
                  onChange={e => setItemForm({
                    ...itemForm,
                    name: e.target.value
                  })}
                />
              </label>

              <div className="form-row">
                <label>
                  Report type
                  <select
                    value={itemForm.type}
                    onChange={e => setItemForm({
                      ...itemForm,
                      type: e.target.value
                    })}
                  >
                    <option>Lost</option>
                    <option>Found</option>
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={itemForm.category}
                    onChange={e => setItemForm({
                      ...itemForm,
                      category: e.target.value
                    })}
                  >
                    <option>Electronics</option>
                    <option>Accessories</option>
                    <option>Documents</option>
                    <option>Books</option>
                    <option>Clothing</option>
                    <option>Other</option>
                  </select>
                </label>
              </div>

              <label>
                Location
                <input
                  required
                  placeholder="Where was it lost or found?"
                  value={itemForm.location}
                  onChange={e => setItemForm({
                    ...itemForm,
                    location: e.target.value
                  })}
                />
              </label>

              <label>
                Date
                <input
                  required
                  type="date"
                  value={itemForm.date}
                  onChange={e => setItemForm({
                    ...itemForm,
                    date: e.target.value
                  })}
                />
              </label>

              <label>
                Description
                <textarea
                  required
                  rows="4"
                  placeholder="Describe the item and identifying details..."
                  value={itemForm.description}
                  onChange={e => setItemForm({
                    ...itemForm,
                    description: e.target.value
                  })}
                />
              </label>

              {editingId && (
                <label>
                  Report status
                  <select
                    value={itemForm.status}
                    onChange={e => setItemForm({
                      ...itemForm,
                      status: e.target.value
                    })}
                  >
                    <option>Open</option>
                    <option>Claimed</option>
                    <option>Resolved</option>
                  </select>
                </label>
              )}

              <label className="image-upload-label">
                <span>Item picture (optional)</span>

                <div className="image-upload-box">
                  <ImagePlus size={25} />
                  <strong>
                    {selectedImage ? selectedImage.name : 'Choose an image'}
                  </strong>
                  <small>JPG, PNG or WEBP · Maximum 5 MB</small>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                  />
                </div>
              </label>

              {imagePreview && (
                <div className="image-preview-wrapper">
                  <img src={imagePreview} alt="Selected item preview" />
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={() => {
                      setSelectedImage(null)
                      setImagePreview('')
                    }}
                  >
                    <X size={15} /> Remove preview
                  </button>
                </div>
              )}

              <button
                className="primary-button full-button"
                disabled={loading}
              >
                {loading
                  ? <LoaderCircle className="spin" size={18} />
                  : editingId ? 'Save changes' : 'Publish report'}

                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
