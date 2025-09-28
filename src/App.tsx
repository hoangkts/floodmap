import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import dataset from '../dataset.json';
import UploadForm from './UploadForm';
import './App.css';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface UserReport {
  id: number;
  latitude: number;
  longitude: number;
  water_level_m: number;
  description: string;
  status: string;
  datetime: string;
}

interface AIPrediction {
  id: number;
  result: string;
  timestamp: string;
}

function MapPage({ userReports }: { userReports: UserReport[] }) {
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [aiPredictions, setAiPredictions] = useState<AIPrediction[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'green';
      case 'warning': return 'orange';
      case 'danger': return 'red';
      default: return 'blue';
    }
  };

  const getLatestWaterLevel = (cameraId: number) => {
    const levels = dataset.water_levels.filter(w => w.camera_id === cameraId);
    return levels.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0];
  };

  const runAIPrediction = async () => {
    setLoading(true);
    try {
      const genAI = new GoogleGenerativeAI('AIzaSyAHTPFzd2gXtcHDK1pAMdFfmO4OOcJrP6g');
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const cameraData = dataset.camera_points.map(camera => {
        const level = getLatestWaterLevel(camera.id);
        return `${camera.name} (${camera.location}): ${level.water_level_m}m, ${level.status}`;
      }).join('; ');

      const userData = userReports.map(report => 
        `Báo cáo: ${report.latitude}, ${report.longitude}: ${report.water_level_m}m, ${report.description}, ${report.status}`
      ).join('; ');

      const prompt = `Dựa trên dữ liệu camera: ${cameraData}. Dữ liệu báo cáo người dân: ${userData}. Hãy dự đoán tình hình ngập lụt tại Đà Nẵng trong 2 giờ tới và đề xuất hành động phòng ngừa. Trả lời bằng tiếng Việt với format sau:
Tiêu đề: [Tiêu đề chính]
Nội dung dự đoán: [Mô tả chi tiết]
Cảnh báo hành động: [Đề xuất hành động]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log('AI Response:', text);

      const newPrediction: AIPrediction = {
        id: Date.now(),
        result: text,
        timestamp: new Date().toISOString(),
      };

      setAiPredictions(prev => [newPrediction, ...prev]);
    } catch (error) {
      console.error('Error running AI prediction:', error);
      alert('Lỗi khi chạy dự đoán AI. Vui lòng kiểm tra API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px 20px', backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '50px', width: 'auto' }} />
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#000000' }}>Bản đồ Ngập lụt Đô thị Thông minh Đà Nẵng</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Link to="/upload" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', transition: 'background-color 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
          >
            Upload Thông Tin
          </Link>
        </div>
      </div>
      <div className="map-container">
        <div style={{ flex: 1 }}>
          <MapContainer center={[16.0544, 108.2022]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {dataset.camera_points.map((camera) => {
              const waterLevel = getLatestWaterLevel(camera.id);
              return (
                <Marker
                  key={camera.id}
                  position={[camera.latitude, camera.longitude]}
                  icon={new L.Icon({
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${getStatusColor(waterLevel.status)}.png`,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                  })}
                >
                  <Popup>
                    <div>
                      <h3>{camera.name} (Camera)</h3>
                      <p>Vị trí: {camera.location}</p>
                      <p>Mực nước: {waterLevel.water_level_m} m</p>
                      <p>Trạng thái: {waterLevel.status}</p>
                      <p>Thời gian: {new Date(waterLevel.datetime).toLocaleString('vi-VN')}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            {userReports.map((report) => (
              <Marker
                key={`user-${report.id}`}
                position={[report.latitude, report.longitude]}
                icon={new L.Icon({
                  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${getStatusColor(report.status)}.png`,
                  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41]
                })}
              >
                <Popup>
                  <div>
                    <h3>Báo cáo Người dân</h3>
                    <p>Mực nước: {report.water_level_m} m</p>
                    <p>Mô tả: {report.description}</p>
                    <p>Trạng thái: {report.status}</p>
                    <p>Thời gian: {new Date(report.datetime).toLocaleString('vi-VN')}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="map-sidebar">
          <h2 style={{ color: '#00008B', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Kịch bản Dự đoán</h2>
          {dataset.scenarios.slice(0, showAllScenarios ? dataset.scenarios.length : 5).map((scenario) => (
            <div key={scenario.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: '#ffffff', color: '#00008B' }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#00008B' }}>{scenario.name}</h4>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#00008B' }}>{scenario.description}</p>
              <p style={{ margin: '5px 0', fontSize: '12px', color: '#00008B' }}>Thời gian dự đoán: {new Date(scenario.predicted_time).toLocaleString('vi-VN')}</p>
            </div>
          ))}
          {!showAllScenarios && dataset.scenarios.length > 5 && (
            <button 
              onClick={() => setShowAllScenarios(true)}
              style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Xem Chi Tiết
            </button>
          )}
          {showAllScenarios && (
            <button 
              onClick={() => setShowAllScenarios(false)}
              style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Thu Gọn
            </button>
          )}
          <h2 style={{ color: '#00008B', borderBottom: '2px solid #28a745', paddingBottom: '5px', marginTop: '20px' }}>Dự đoán AI (Mới nhất)</h2>
          {aiPredictions.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#00008B' }}>Chưa có dự đoán AI. Nhấp nút "Chạy Dự đoán AI" để tạo.</p>
          ) : (
            aiPredictions.slice(0, 3).map((prediction) => (
              <div key={prediction.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: '#e9ecef' }}>
                <p style={{ margin: '0', fontSize: '13px', color: '#00008B' }}>{prediction.result}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#6c757d' }}>Thời gian: {new Date(prediction.timestamp).toLocaleString('vi-VN')}</p>
              </div>
            ))
          )}
          <button 
            onClick={runAIPrediction}
            disabled={loading}
            style={{ marginTop: '10px', padding: '10px 20px', backgroundColor: loading ? '#6c757d' : '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s' }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#c82333')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.backgroundColor = '#dc3545')}
          >
            {loading ? 'Đang chạy...' : 'Chạy Dự đoán AI'}
          </button>
        </div>
      </div>
      <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', fontSize: '14px', color: '#6c757d' }}>
        © 2025 DAU. All rights reserved.
      </div>
    </div>
  );
}

function App() {
  const [userReports, setUserReports] = useState<UserReport[]>([]);

  const handleAddReport = (report: UserReport) => {
    setUserReports(prev => [...prev, report]);
  };

  return (
    <Routes>
      <Route path="/" element={<MapPage userReports={userReports} />} />
      <Route path="/upload" element={<UploadForm onAddReport={handleAddReport} />} />
    </Routes>
  );
}

export default App;
