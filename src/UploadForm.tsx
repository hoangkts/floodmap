import { useState } from 'react';
import { Link } from 'react-router-dom';

interface UserReport {
  id: number;
  latitude: number;
  longitude: number;
  water_level_m: number;
  description: string;
  status: string;
  datetime: string;
}

function UploadForm({ onAddReport }: { onAddReport: (report: UserReport) => void }) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [waterLevel, setWaterLevel] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('normal');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const report: UserReport = {
      id: Date.now(), // Simple ID generation
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      water_level_m: parseFloat(waterLevel),
      description,
      status,
      datetime: new Date().toISOString(),
    };
    onAddReport(report);
    // Reset form
    setLatitude('');
    setLongitude('');
    setWaterLevel('');
    setDescription('');
    setStatus('normal');
    alert('Cảm ơn bạn đã gửi thông tin! Dữ liệu sẽ được sử dụng để cải thiện dự báo.');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Upload Thông Tin Lụt Lội</h1>
      <p>Giúp chúng tôi thu thập dữ liệu thời gian thực để cải thiện dự báo ngập lụt.</p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Vĩ độ (Latitude): </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Kinh độ (Longitude): </label>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mực nước (m): </label>
          <input
            type="number"
            step="0.1"
            value={waterLevel}
            onChange={(e) => setWaterLevel(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mô tả: </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Trạng thái: </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="normal">Bình thường</option>
            <option value="warning">Cảnh báo</option>
            <option value="danger">Nguy hiểm</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          Gửi Thông Tin
        </button>
      </form>
      <br />
      <Link to="/">Quay lại Bản đồ</Link>
    </div>
  );
}

export default UploadForm;