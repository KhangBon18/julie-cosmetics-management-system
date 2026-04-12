import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { FiSave, FiDatabase, FiSettings, FiRefreshCw } from 'react-icons/fi';
import { settingsService } from '../services/dataService';
import usePermission from '../hooks/usePermission';

const SettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const { canUpdate } = usePermission();
  const canUpdateSettings = canUpdate('settings');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await settingsService.getAll();
      setSettings(Array.isArray(data) ? data : []);
      setHasChanges(false);
    } catch (error) {
      const message = error.message || 'Không thể tải cấu hình hệ thống';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setHasChanges(true);
    setSettings(prev => prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canUpdateSettings) {
      toast.error('Bạn không có quyền cập nhật cấu hình');
      return;
    }
    try {
      setSaving(true);
      await settingsService.bulkUpdate(settings.map(s => ({ key: s.setting_key, value: s.setting_value })));
      toast.success('Cập nhật cấu hình thành công');
      await fetchSettings();
    } catch (error) {
      toast.error(error.message || 'Lỗi khi lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    if (!canUpdateSettings) {
      toast.error('Bạn không có quyền sao lưu dữ liệu');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn thực hiện sao lưu toàn bộ dữ liệu ngay bây giờ?')) return;
    try {
      setBackingUp(true);
      setBackupLogs([]);
      const res = await settingsService.backup();
      if (res.success) {
        toast.success('Sao lưu thành công!');
        setBackupLogs(res.output || ['Thành công!']);
      }
    } catch (error) {
      toast.error('Lỗi khi sao lưu: ' + (error.message || 'Không xác định'));
    } finally {
      setBackingUp(false);
    }
  };

  const settingsByCategory = useMemo(() => {
    const grouped = new Map();
    for (const item of settings) {
      const key = item.category || 'general';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return Array.from(grouped.entries());
  }, [settings]);

  if (loading) return <div className="text-center p-5">Đang tải cấu hình hệ thống...</div>;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0"><FiSettings className="me-2" />Cấu hình Hệ thống</h2>
        <button className="btn btn-outline-secondary" onClick={fetchSettings} disabled={loading || saving || backingUp}>
          <FiRefreshCw className="me-2" />Tải lại
        </button>
      </div>

      <div className="row">
        {/* Settings Form */}
        <div className="col-md-7">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Tham số nghiệp vụ</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                {loadError && (
                  <div className="alert alert-danger">
                    <div><strong>Không tải được cấu hình.</strong></div>
                    <div className="small">{loadError}</div>
                  </div>
                )}

                {!loadError && settings.length === 0 && <p className="text-muted">Chưa có cấu hình nào.</p>}

                {settingsByCategory.map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="text-uppercase text-muted mb-0">{category}</h6>
                      <span className="small text-muted">{items.length} tham số</span>
                    </div>
                    {items.map(s => (
                      <div className="mb-3" key={s.setting_key}>
                        <label className="form-label fw-bold">{s.setting_key}</label>
                        <input
                          type={s.data_type === 'number' ? 'number' : 'text'}
                          className="form-control"
                          value={s.setting_value}
                          onChange={(e) => handleChange(s.setting_key, e.target.value)}
                          disabled={!canUpdateSettings || saving}
                        />
                        <div className="form-text">{s.description}</div>
                      </div>
                    ))}
                  </div>
                ))}

                {!canUpdateSettings && (
                  <div className="alert alert-warning py-2">
                    Bạn chỉ có quyền xem cấu hình. Chức năng cập nhật và sao lưu đã bị khóa.
                  </div>
                )}

                <button type="submit" className="btn btn-primary" disabled={saving || !canUpdateSettings || !hasChanges || settings.length === 0}>
                  <FiSave className="me-2" />
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Backup & Tools */}
        <div className="col-md-5">
          <div className="card shadow-sm mb-4 border-warning">
            <div className="card-header bg-warning bg-opacity-10 text-warning-emphasis">
              <h5 className="mb-0"><FiDatabase className="me-2" />Sao lưu & Bảo trì</h5>
            </div>
            <div className="card-body text-center p-4">
              <p className="text-muted mb-4">
                Thực hiện sao lưu toàn bộ cơ sở dữ liệu (Schema, Dữ liệu, Triggers, Routines) thành file .sql.gz. Các bản sao lưu sẽ được lưu tại <code>database/backups/</code>.
              </p>
              <button 
                onClick={handleBackup} 
                className="btn btn-warning btn-lg w-100 mb-3" 
                disabled={backingUp || !canUpdateSettings}
              >
                {backingUp ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Đang sao lưu...</>
                ) : (
                  <><FiDatabase className="me-2" />Sao lưu Database ngay</>
                )}
              </button>
              
              {backupLogs.length > 0 && (
                <div className="mt-3 text-start">
                  <div className="alert alert-success py-2 px-3 small">
                    <strong>Kết quả:</strong>
                    <ul className="mb-0 mt-1 list-unstyled">
                      {backupLogs.map((log, i) => <li key={i}>• {log}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="card-footer bg-light small text-muted">
              Lưu ý: Hệ thống tự động xóa các bản sao lưu cũ hơn 30 ngày.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
