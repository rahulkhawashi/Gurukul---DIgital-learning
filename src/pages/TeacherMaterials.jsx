import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToTeacherClasses } from '../services/classService';
import { subscribeToMaterials, addMaterial, deleteMaterial, detectMaterialType, uploadMaterialFile } from '../services/materialService';
import { FiPlus, FiLink, FiVideo, FiFileText, FiImage, FiTrash2, FiExternalLink } from 'react-icons/fi';
import '../styles/components.css';
import '../styles/pages.css';

export default function TeacherMaterials() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [materials, setMaterials] = useState([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubClasses = subscribeToTeacherClasses(user.uid, (data) => {
      setClasses(data);
      if (data.length > 0 && !selectedClass) {
        setSelectedClass(data[0].classId);
      }
    });
    return () => unsubClasses();
  }, [user]);

  useEffect(() => {
    if (!selectedClass) {
      setMaterials([]);
      return;
    }
    const unsubMaterials = subscribeToMaterials(selectedClass, setMaterials);
    return () => unsubMaterials();
  }, [selectedClass]);

  async function handleAddMaterial(e) {
    e.preventDefault();
    if (!selectedClass || (!newUrl && !uploadFile) || !newTitle) {
      alert("Please provide a title and either a File or URL");
      return;
    }
    
    setIsSubmitting(true);
    try {
      let finalUrl = newUrl;
      if (uploadFile) {
        finalUrl = await uploadMaterialFile(selectedClass, uploadFile);
      }

      const type = detectMaterialType(uploadFile ? uploadFile.name : finalUrl);
      const tagsArray = newTags.split(',').map(t => t.trim()).filter(t => t);
      
      await addMaterial(selectedClass, {
        url: finalUrl,
        title: newTitle,
        description: newDesc,
        tags: tagsArray,
        type
      });
      
      setIsModalOpen(false);
      setNewUrl('');
      setNewTitle('');
      setNewDesc('');
      setNewTags('');
      setUploadFile(null);
    } catch (err) {
      console.error('Error adding material:', err);
      alert('Failed to add material. Please check Firebase Storage rules.');
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterial(id);
      } catch (err) {
        console.error('Error deleting material:', err);
      }
    }
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'video': return <FiVideo size={20} color="var(--primary)" />;
      case 'pdf': return <FiFileText size={20} color="var(--tertiary)" />;
      case 'image': return <FiImage size={20} color="var(--secondary)" />;
      default: return <FiLink size={20} color="var(--outline)" />;
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--headline-sm)', marginBottom: 'var(--space-1)' }}>Materials Manager</h1>
          <p style={{ color: 'var(--on-surface-variant)' }}>Share resources with your classes</p>
        </div>
        
        {classes.length > 0 && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <FiPlus style={{ marginRight: 8 }} />
            Add Material
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <h3>No Classes Yet</h3>
          <p>Create a class from the Dashboard first to share materials.</p>
        </div>
      ) : (
        <>
          <div className="input-group" style={{ maxWidth: 300, marginBottom: 'var(--space-6)' }}>
            <label>Select Class</label>
            <select 
              className="input-field" 
              value={selectedClass || ''} 
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className} ({c.classCode})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {materials.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', minHeight: '30vh' }}>
                <p>No materials shared in this class yet.</p>
              </div>
            ) : (
              materials.map(mat => (
                <div key={mat.id} className="card-elevated" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div style={{ padding: 'var(--space-2)', background: 'var(--surface-container-high)', borderRadius: 'var(--radius-md)' }}>
                      {getIconForType(mat.type)}
                    </div>
                    <button 
                      onClick={() => handleDelete(mat.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 4 }}
                      title="Delete Material"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  
                  <h3 style={{ fontSize: 'var(--title-md)', marginBottom: 'var(--space-2)' }}>{mat.title}</h3>
                  {mat.description && (
                    <p style={{ fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)', marginBottom: 'var(--space-3)', flexGrow: 1 }}>
                      {mat.description}
                    </p>
                  )}
                  
                  {mat.tags?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 'var(--space-4)' }}>
                      {mat.tags.map(tag => (
                        <span key={tag} className="badge" style={{ background: 'var(--surface-container-high)', fontSize: '0.75rem' }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <a 
                    href={mat.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center' }}
                  >
                    Open Link <FiExternalLink style={{ marginLeft: 8 }} />
                  </a>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Add Material Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 'var(--title-lg)', ...{ marginBottom: 'var(--space-6)' }}}>Add New Material</h2>
            <form onSubmit={handleAddMaterial}>
              <div className="input-group">
                <label>Upload File OR Resource URL *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <input 
                    type="file" 
                    className="input-field" 
                    onChange={e => {
                      setUploadFile(e.target.files[0]);
                      if (e.target.files[0]) setNewUrl('');
                    }} 
                    accept=".pdf,video/*,image/*"
                  />
                  <div style={{ textAlign: 'center', fontSize: 'var(--body-sm)', color: 'var(--on-surface-variant)' }}>— OR —</div>
                  <input 
                    type="url" 
                    className="input-field" 
                    value={uploadFile ? 'File attached' : newUrl} 
                    onChange={e => setNewUrl(e.target.value)} 
                    placeholder="https://youtube.com/... or https://.../file.pdf"
                    disabled={!!uploadFile}
                    required={!uploadFile}
                  />
                </div>
              </div>
              <div className="input-group">
                <label>Title *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Intro to Algebra Video"
                  required 
                />
              </div>
              <div className="input-group">
                <label>Description (Optional)</label>
                <textarea 
                  className="input-field" 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Brief context for students..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="input-group">
                <label>Tags (Optional, comma separated)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newTags} 
                  onChange={e => setNewTags(e.target.value)} 
                  placeholder="math, intro, video"
                />
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="button" className="btn" style={{ flex: 1, background: 'var(--surface-container-high)' }} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
