import React, { useState, useEffect } from 'react';
import { Input, Button, List, Avatar, Typography } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Title } = Typography;

const formatAIResponse = (text) => {
  const emojiMap = {
    '交通方案': '🚄',
    '住宿推荐': '🏨',
    '热门景点': '🏞️',
    '美食推荐': '🍜',
    '每日行程安排': '📆',
    '每日费用预算': '💰',
    '总费用估算': '📊',
    '实用旅行小贴士': '📝',
    '上午': '🌞',
    '下午': '🌇',
    '晚上': '🌙',
    '经济型': '💰',
    '舒适型': '🏆',
    '总计': '🧮',
    '第一天': '1️⃣',
    '第二天': '2️⃣',
    '第三天': '3️⃣',
    '第四天': '4️⃣',
    '第五天': '5️⃣'
  };

  const sections = text.split(/####|###|\n(?=🚄|交通方案|住宿推荐|热门景点|美食推荐|每日行程安排|每日费用预算|总费用估算|实用旅行小贴士)/);
  return sections.map((section, index) => {
    const lines = section.split('\n').filter(line => line.trim() !== '');
    const title = lines.length > 0 ? lines[0] : '';
    let content = lines.slice(1);
    const emoji = title.match(/^\p{Emoji}/u) ? '' : (emojiMap[title.trim()] || '✨');
    content = content.map(line => line.replace(/---$/, '').trim());

    return (
      <div key={index} className="ai-response-section">
        {index === 0 ? (
          <h2 className="travel-plan-title">{title}</h2>
        ) : (
          title && <h3>{emoji} {title.trim().replace(/^[#\s]+/, '')}</h3>
        )}
        {content.map((line, lineIndex) => {
          if (line.startsWith('- ')) {
            return <p key={lineIndex} className="list-item">💖 {line.substring(2)}</p>;
          } else if (line.includes('**')) {
            const parts = line.split('**');
            return (
              <p key={lineIndex}>
                {parts.map((part, partIndex) => 
                  partIndex % 2 === 0 ? part : <strong key={partIndex}>🌟 {part}</strong>
                )}
              </p>
            );
          } else if (line.match(/^[0-9]+\./)) {
            return <p key={lineIndex} className="list-item">🔸 {line.replace(/^[0-9]+\./, '')}</p>;
          } else if (Object.keys(emojiMap).some(key => line.startsWith(key))) {
            const matchedKey = Object.keys(emojiMap).find(key => line.startsWith(key));
            const lineEmoji = line.match(/^\p{Emoji}/u) ? '' : emojiMap[matchedKey];
            return <h4 key={lineIndex}>{lineEmoji} {line}</h4>;
          } else {
            return <p key={lineIndex}>{line}</p>;
          }
        })}
      </div>
    );
  });
};

const WelcomeMessage = () => (
  <div className="welcome-message">
    <img src="/travel-icon.png" alt="Travel Icon" className="welcome-icon" />
    <h2>欢迎使用旅行规划助手！</h2>
    <p>告诉我您的旅行计划，我将为您定制完美的行程。</p>
    <ul>
      <li>输入您的出发地和目的地</li>
      <li>告诉我旅行的人数和天数</li>
      <li>我会为您规划交通、住宿、景点和美食</li>
      <li>例如：北京到三亚，2人，3天</li>
    </ul>
  </div>
);

const TravelAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setInterval(() => {
        setLoadingTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        'api/v1/services/aigc/text-generation/generation',
        {
          model: 'qwen1.5-110b-chat',
          input: {
            messages: [
              { role: 'system', content: `你是一位专业的旅行行程规划师，擅长制定小红书风格的旅行攻略。请根据用户提供的出发地、目的地、人数和天数，制定详细的旅行行程计划。你的回答应包含以下内容：

1. 交通方案：提供从出发地到目的地的合适、便捷的交通选择，包括飞机、高铁、火车等，优先推荐速度最快的交通方式，并给出大致时间及价格。

2. 住宿推荐：推荐当地热门的酒店或民宿,避免推荐青年旅社，分为经济型和舒适型两个档次，每个档次至少推荐2-3个选择，并给出价格范围，需给出对应住宿地点的详细位置。

3. 热门景点：列出5-8个当地最受欢迎的景点，简要介绍特色和门票价格，并且需给出景点详细位置并给出推荐理由。

4. 美食推荐：推荐5-8种当地特色美食或网红餐厅，提供价格参考，并且需给出美食地点详细位置并给出推荐理由。

5. 每日行程安排：
   - 为每一天制定两套方案：经济型和舒适型
   - 详细列出上午、下午和晚上的活动
   - 包括根据活动地点给出就餐建议和预计花费
   - 考虑景点之间的距离和游览时间

6. 每日费用预算：分别计算经济型和舒适型方案的每日预算。

7. 总费用估算：分别计算济型和舒适型方案总费用，包括交通、住宿、餐饮、门票和其他开支。

请以小红书的风格呈现内容，采用标题、加粗、列表等格式让内容更加美观易读。根据标题和内容需要适当的添加适配的emoji，最后，给出一些实用的旅行小贴士。无需回复任何和旅行不相关的内容` },
              { role: 'user', content: input }
            ]
          }
        },
        {
          headers: {
            'Authorization': 'Bearer sk-7263b1f9500644bf97ec1910ac4a982b',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('API Response:', response.data);
      const aiMessage = { type: 'ai', content: formatAIResponse(response.data.output.text || response.data.choices[0].message.content) };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { type: 'ai', content: '抱歉，我遇到了一些问题。请稍后再试。' };
      setMessages([...messages, userMessage, errorMessage]);
    }

    setLoading(false);
  };

  return (
    <div className="travel-assistant">
      <Title level={2} className="travel-assistant-title">旅行规划助手</Title>
      <div className="message-container">
        {messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <List
            className="message-list"
            itemLayout="horizontal"
            dataSource={messages}
            renderItem={(item) => (
              <List.Item className={`message-item ${item.type}`}>
                {item.type === 'ai' && <Avatar icon={<RobotOutlined />} className="assistant-avatar" />}
                <div className="message-content">{typeof item.content === 'string' ? item.content : item.content}</div>
                {item.type === 'user' && <Avatar icon={<UserOutlined />} className="user-avatar" />}
              </List.Item>
            )}
          />
        )}
      </div>
      <div className="input-container">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hi～告诉我你的旅行计划吧！✈️"
          className="input-field"
          suffix={
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendMessage}
              loading={loading}
              className="send-button"
            >
              {loading ? '寻找最佳方案...请耐心等待' : '发送'}
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default TravelAssistant;
