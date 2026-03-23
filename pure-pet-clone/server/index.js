const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/stats', (req, res) => {
  res.json({
    mealsDelivered: 92747351,
    ailmentImprovement: 94,
    healthImprovement: 91,
  });
});

app.get('/api/faqs', (req, res) => {
  res.json([
    { id: 1, question: 'Am I tied into a subscription?', answer: 'Not at all! You can pause, change, or cancel your plan at any time. We believe in our food so much that we don\'t need to lock you in.' },
    { id: 2, question: 'Is Pure expensive compared to other foods?', answer: 'Pure starts from only 89p per day. When you consider the health benefits, it\'s great value compared to vet bills and other premium foods.' },
    { id: 3, question: 'Do I pay for delivery?', answer: 'No! Delivery is completely free on all orders. We deliver right to your doorstep.' },
    { id: 4, question: 'What is the nutritional value, and is it good for my dog?', answer: 'Pure is a complete, balanced meal developed with veterinary nutritionists. Every recipe meets FEDIAF guidelines.' },
    { id: 5, question: 'What if my dog doesn\'t like it?', answer: 'We offer a full money-back guarantee. If your dog doesn\'t love Pure, we\'ll refund your first box in full.' },
    { id: 6, question: 'Is Pure suitable for my dogs health concern?', answer: 'Pure is often recommended for dogs with health concerns. Our recipes are gentle and made with natural ingredients.' },
    { id: 7, question: 'Is Pure complete dog food?', answer: 'Yes! Every Pure recipe is nutritionally complete and balanced, meeting all FEDIAF guidelines for adult dogs and puppies.' },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
