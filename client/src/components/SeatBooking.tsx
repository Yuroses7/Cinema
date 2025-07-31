import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface Seat {
  id: number;
  row_letter: string;
  seat_number: number;
  seat_type: 'regular' | 'premium' | 'vip';
  price: number;
  isBooked?: boolean;
}

interface Movie {
  id: number;
  title: string;
  poster_url: string;
}

interface Showtime {
  id: number;
  movie_id: number;
  time: string;
}

const API_BASE = 'http://localhost:5000/api';

const SeatBookingPage: React.FC = () => {
  // State
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<number | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentSlip, setPaymentSlip] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);

  // API Helper
  const fetchData = async (endpoint: string) => {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [movieData, showtimeData] = await Promise.all([
          fetchData('/movies'),
          fetchData('/showtimes')
        ]);
        setMovies(Array.isArray(movieData.movies || movieData) ? (movieData.movies || movieData) : []);
        setShowtimes(Array.isArray(showtimeData.showtimes || showtimeData) ? (showtimeData.showtimes || showtimeData) : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load seats when showtime changes
  useEffect(() => {
    if (!selectedShowtime) {
      setSeats([]);
      setSelectedSeats([]);
      return;
    }

    const loadSeats = async () => {
      try {
        const data = await fetchData(`/showtimes/${selectedShowtime}/seats`);
        const seatsData = Array.isArray(data.data || data.seats || data) ? (data.data || data.seats || data) : [];
        setSeats(seatsData.map((seat: any) => ({
          id: seat.id || 0,
          row_letter: seat.row_letter || '',
          seat_number: seat.seat_number || 0,
          seat_type: seat.seat_type || 'regular',
          price: Number(seat.price) || 0,
          isBooked: seat.is_booked || seat.isBooked || false
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load seats');
        setSeats([]);
      }
    };
    loadSeats();
  }, [selectedShowtime]);

  // Handlers
  const toggleSeatSelection = useCallback((seat: Seat) => {
    if (seat.isBooked) return;
    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id);
      return isSelected ? prev.filter(s => s.id !== seat.id) : [...prev, seat];
    });
  }, []);

  const getSeatColor = useCallback((seat: Seat) => {
    if (seat.isBooked) return 'bg-red-500 cursor-not-allowed';
    if (selectedSeats.find(s => s.id === seat.id)) return 'bg-green-500';
    const colors = {
      vip: 'bg-amber-500 hover:bg-amber-400',
      premium: 'bg-blue-500 hover:bg-blue-400',
      regular: 'bg-gray-500 hover:bg-gray-400'
    };
    return colors[seat.seat_type];
  }, [selectedSeats]);

  const totalPrice = useMemo(() =>
    selectedSeats.reduce((total, seat) => total + seat.price, 0),
    [selectedSeats]
  );

  const groupedSeats = useMemo(() => {
    return seats.reduce((groups, seat) => {
      if (!groups[seat.row_letter]) groups[seat.row_letter] = [];
      groups[seat.row_letter].push(seat);
      return groups;
    }, {} as Record<string, Seat[]>);
  }, [seats]);

  const generatePaymentReference = () => `AF${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const generateQRCode = (amount: number, reference: string) => {
    const qrData = { amount, reference, merchant: 'AF Cineplex', description: `Booking - ${reference}` };
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(qrData))}`;
  };

  const handlePaymentSlipUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPG, PNG)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }
    setPaymentSlip(file);
  };

  const initiatePayment = () => {
    if (!selectedShowtime || selectedSeats.length === 0 || !customerName || !customerEmail) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    const reference = generatePaymentReference();
    setPaymentReference(reference);
    setQrCodeUrl(generateQRCode(totalPrice, reference));
    setShowPaymentModal(true);
  };

  const handleBooking = async () => {
    if (!paymentSlip) {
      alert('กรุณาอัปโหลดหลักฐานการชำระเงิน');
      return;
    }

    setIsBooking(true);
    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          showtimeId: selectedShowtime,
          customerName,
          customerEmail,
          seatIds: selectedSeats.map(seat => seat.id),
          ticketImagePath: `/uploads/payment-slips/${paymentReference}.jpg`
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        alert(`จองตั๋วสำเร็จ! รหัสการจอง: ${result.data?.booking_id || 'N/A'}`);
        // Reset form
        setSelectedSeats([]);
        setCustomerName('');
        setCustomerEmail('');
        setPaymentSlip(null);
        setShowPaymentModal(false);
        setPaymentReference('');
        setQrCodeUrl('');
        // Reload seats
        const data = await fetchData(`/showtimes/${selectedShowtime}/seats`);
        const seatsData = Array.isArray(data.data || data.seats || data) ? (data.data || data.seats || data) : [];
        setSeats(seatsData.map((seat: any) => ({
          id: seat.id || 0,
          row_letter: seat.row_letter || '',
          seat_number: seat.seat_number || 0,
          seat_type: seat.seat_type || 'regular',
          price: seat.price || 0,
          isBooked: seat.is_booked || seat.isBooked || false
        })));
      } else {
        alert(`เกิดข้อผิดพลาด: ${result.message || result.error}`);
      }
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsBooking(false);
    }
  };

  // Loading and Error states
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mx-auto mb-4"></div>
          <h2 className="text-white text-xl">กำลังโหลดข้อมูล...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-white text-xl mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const selectedMovieData = movies.find(m => m.id === selectedMovie);
  const selectedShowtimeData = showtimes.find(s => s.id === selectedShowtime);
  const filteredShowtimes = showtimes.filter(s => s.movie_id === selectedMovie);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎬</span>
            </div>
            <h1 className="text-2xl font-bold text-white">AF Cineplex - เลือกที่นั่ง</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Movie Selection */}
            <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">เลือกภาพยนตร์</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map(movie => (
                  <div
                    key={movie.id}
                    className={`cursor-pointer border-2 rounded-lg p-3 transition-all ${
                      selectedMovie === movie.id ? 'border-amber-500 bg-amber-500/10' : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => {
                      setSelectedMovie(movie.id);
                      setSelectedShowtime(null);
                      setSelectedSeats([]);
                      setSeats([]);
                    }}
                  >
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-32 object-cover rounded mb-2"
                      onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'}
                    />
                    <h3 className="text-white font-medium text-sm">{movie.title}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Showtime Selection */}
            {selectedMovie && (
              <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">เลือกรอบฉาย</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {filteredShowtimes.map(showtime => (
                    <button
                      key={showtime.id}
                      className={`p-3 rounded-lg transition-all ${
                        selectedShowtime === showtime.id
                          ? 'bg-amber-500 text-black font-medium'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedShowtime(showtime.id);
                        setSelectedSeats([]);
                      }}
                    >
                      {showtime.time?.slice(0, 5) || 'N/A'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seat Map */}
            {selectedShowtime && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">เลือกที่นั่ง</h2>

                {seats.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">กำลังโหลดข้อมูลที่นั่ง...</p>
                  </div>
                ) : (
                  <>
                    {/* Screen */}
                    <div className="mb-8">
                      <div className="w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent rounded-full mb-2"></div>
                      <p className="text-center text-gray-400 text-sm">จอภาพยนตร์</p>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                      {[
                        { color: 'bg-amber-500', label: 'VIP (฿350)' },
                        { color: 'bg-blue-500', label: 'Premium (฿280)' },
                        { color: 'bg-gray-500', label: 'Regular (฿220)' },
                        { color: 'bg-green-500', label: 'เลือกแล้ว' },
                        { color: 'bg-red-500', label: 'จองแล้ว' }
                      ].map(item => (
                        <div key={item.label} className="flex items-center space-x-2">
                          <div className={`w-4 h-4 ${item.color} rounded`}></div>
                          <span className="text-white text-sm">{item.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Seats */}
                    <div className="space-y-3">
                      {Object.keys(groupedSeats).sort().map(row => (
                        <div key={row} className="flex items-center justify-center space-x-2">
                          <span className="text-white font-bold w-6 text-center">{row}</span>
                          <div className="flex space-x-1">
                            {groupedSeats[row]
                              .sort((a, b) => a.seat_number - b.seat_number)
                              .map(seat => (
                                <button
                                  key={seat.id}
                                  className={`w-8 h-8 rounded text-xs font-bold transition-all ${getSeatColor(seat)} ${
                                    seat.isBooked ? '' : 'hover:scale-110'
                                  }`}
                                  onClick={() => toggleSeatSelection(seat)}
                                  disabled={seat.isBooked}
                                  title={`${seat.row_letter}${seat.seat_number} - ${seat.seat_type} (฿${seat.price})`}
                                >
                                  {seat.seat_number}
                                </button>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">สรุปการจอง</h2>

              {selectedMovieData && (
                <div className="mb-4">
                  <img
                    src={selectedMovieData.poster_url}
                    alt={selectedMovieData.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                    onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=ไม่มีภาพ'}
                  />
                  <h3 className="text-white font-medium">{selectedMovieData.title}</h3>
                  {selectedShowtimeData && (
                    <p className="text-gray-400 text-sm">รอบ {selectedShowtimeData.time?.slice(0, 5)}</p>
                  )}
                </div>
              )}

              {selectedSeats.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-white font-medium mb-2">ที่นั่งที่เลือก:</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedSeats.map(seat => (
                      <span key={seat.id} className="bg-green-500 text-black px-2 py-1 rounded text-sm font-medium">
                        {seat.row_letter}{seat.seat_number}
                      </span>
                    ))}
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 text-xl font-bold">฿{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Customer Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    placeholder="กรอกชื่อ-นามสกุล"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500"
                    placeholder="กรอกอีเมล"
                  />
                </div>
              </div>

              <button
                onClick={initiatePayment}
                disabled={!selectedShowtime || selectedSeats.length === 0 || !customerName || !customerEmail}
                className="w-full mt-6 bg-amber-500 hover:bg-amber-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg transition-colors"
              >
                ดำเนินการชำระเงิน (฿{totalPrice.toFixed(2)})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">ชำระเงิน</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <img src={qrCodeUrl} alt="QR Code สำหรับชำระเงิน" className="w-48 h-48 mx-auto" />
              </div>
              <p className="text-white font-medium mb-2">สแกน QR Code เพื่อชำระเงิน</p>
              <p className="text-amber-400 text-xl font-bold">฿{totalPrice.toFixed(2)}</p>
              <p className="text-gray-400 text-sm">รหัสอ้างอิง: {paymentReference}</p>
            </div>

            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">
                อัปโหลดหลักฐานการชำระเงิน (สลิป)
              </label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-amber-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePaymentSlipUpload}
                  className="hidden"
                  id="payment-slip"
                />
                <label htmlFor="payment-slip" className="cursor-pointer">
                  {paymentSlip ? (
                    <div>
                      <div className="text-green-500 text-4xl mb-2">✓</div>
                      <p className="text-green-400 font-medium">{paymentSlip.name}</p>
                      <p className="text-gray-400 text-sm">คลิกเพื่อเปลี่ยนไฟล์</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 text-4xl mb-2">📷</div>
                      <p className="text-white">คลิกเพื่ออัปโหลดสลิป</p>
                      <p className="text-gray-400 text-sm">รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={!paymentSlip || isBooking}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 px-4 rounded-lg transition-colors"
            >
              {isBooking ? 'กำลังดำเนินการ...' : 'ยืนยันการจอง'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatBookingPage;