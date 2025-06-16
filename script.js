const broker = 'wss://broker.hivemq.com:8884/mqtt';
    const topic = 'esp32/gas';
    const client = mqtt.connect(broker);
    
    let dataHistory = [];
    const maxHistoryItems = 10;

    client.on('connect', function () {
      document.getElementById('connectionStatus').textContent = 'Terhubung ke MQTT Broker';
      document.getElementById('statusIndicator').classList.add('connected');
      
      client.subscribe(topic, function (err) {
        if (!err) {
          console.log('Subscribed to topic:', topic);
        }
      });
    });

    client.on('message', function (topic, message) {
      try {
        const data = JSON.parse(message.toString());
        const mq2Value = data.mq2_value;
        
        updateGasValue(mq2Value);
        updateGasStatus(mq2Value);
        updateGauge(mq2Value);
        updateHistory(mq2Value);
        
        const now = new Date();
        const timeStr = now.toLocaleString('id-ID');
        document.getElementById('lastUpdate').innerHTML = 
          `<i class="fas fa-clock"></i> ${timeStr}`;
        
      } catch (e) {
        console.error('JSON tidak valid:', e);
      }
    });

    client.on('error', function () {
      document.getElementById('connectionStatus').textContent = 'Gagal terhubung ke MQTT';
      document.getElementById('statusIndicator').classList.remove('connected');
    });

    function updateGasValue(value) {
      const element = document.getElementById('mq2');
      element.textContent = value + ' ppm';
      
      // Add animation effect
      element.style.transform = 'scale(1.1)';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
      }, 200);
    }

    function updateGasStatus(value) {
      const statusElement = document.getElementById('gasStatus');
      const alertBanner = document.getElementById('alertBanner');
      
      let condition = "Aman";
      let statusClass = "gas-level-safe";
      
      if (value > 2000) {
        condition = "BAHAYA!";
        statusClass = "gas-level-danger";
        alertBanner.classList.add('show');
      } else if (value > 1000) {
        condition = "Waspada";
        statusClass = "gas-level-warning";
        alertBanner.classList.remove('show');
      } else {
        condition = "Aman";
        statusClass = "gas-level-safe";
        alertBanner.classList.remove('show');
      }
      
      statusElement.textContent = condition;
      statusElement.className = `card-value ${statusClass}`;
    }

    function updateGauge(value) {
      const needle = document.getElementById('gaugeNeedle');
      const gaugeValue = document.getElementById('gaugeValue');
      
      // Calculate rotation (0-180 degrees based on 0-3000 range)
      const maxValue = 3000;
      const rotation = Math.min((value / maxValue) * 180, 180);
      
      needle.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
      gaugeValue.textContent = value;
    }

    function updateHistory(value) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID');
      
      dataHistory.unshift({
        value: value,
        time: timeStr,
        status: value > 2000 ? 'Bahaya' : value > 1000 ? 'Waspada' : 'Aman'
      });
      
      if (dataHistory.length > maxHistoryItems) {
        dataHistory = dataHistory.slice(0, maxHistoryItems);
      }
      
      renderHistory();
    }

    function renderHistory() {
      const container = document.getElementById('historyContainer');
      
      if (dataHistory.length === 0) {
        container.innerHTML = '<div class="history-item"><span>Belum ada data...</span><span>--</span></div>';
        return;
      }
      
      container.innerHTML = dataHistory.map(item => `
        <div class="history-item">
          <span>${item.value} ppm - <strong class="${
            item.status === 'Bahaya' ? 'gas-level-danger' : 
            item.status === 'Waspada' ? 'gas-level-warning' : 'gas-level-safe'
          }">${item.status}</strong></span>
          <span>${item.time}</span>
        </div>
      `).join('');
    }

    // Initialize gauge on load
    document.addEventListener('DOMContentLoaded', function() {
      updateGauge(0);
    });