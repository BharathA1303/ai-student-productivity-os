const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

router.post('/study-plan', async (req, res) => {
  const { subject, hours, date } = req.body;

  if (!subject || !hours || !date) {
    return res.status(400).json({ message: 'Subject, hours, and date are required' });
  }

  const parsedHours = Number(hours);
  const parsedDate = new Date(date);

  if (!Number.isInteger(parsedHours) || parsedHours <= 0) {
    return res.status(400).json({ message: 'Hours must be a positive integer' });
  }

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ message: 'Date must be a valid date' });
  }

  try {
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: req.user.id,
        subject: subject.trim(),
        hours: parsedHours,
        date: parsedDate,
      },
    });

    return res.status(201).json(studyPlan);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create study plan' });
  }
});

router.get('/study-plan', async (req, res) => {
  try {
    const plans = await prisma.studyPlan.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'asc' },
    });

    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch study plans' });
  }
});

module.exports = router;
