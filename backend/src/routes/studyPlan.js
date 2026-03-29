const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

router.post('/ai-plan', (req, res) => {
  const { subjects, totalHours } = req.body;

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Subjects must be a non-empty array' });
  }

  const parsedSubjects = subjects
    .map((subject) => (typeof subject === 'string' ? subject.trim() : ''))
    .filter((subject) => subject.length > 0);

  if (parsedSubjects.length === 0) {
    return res.status(400).json({ message: 'Please provide at least one valid subject' });
  }

  if (parsedSubjects.length !== subjects.length) {
    return res.status(400).json({ message: 'All subjects must be non-empty strings' });
  }

  const parsedTotalHours = Number(totalHours);

  if (!Number.isFinite(parsedTotalHours) || parsedTotalHours <= 0) {
    return res.status(400).json({ message: 'Total hours must be a positive number' });
  }

  const subjectCount = parsedSubjects.length;
  const weights = parsedSubjects.map((_, index) => {
    if (index === 0) {
      return subjectCount + 2;
    }

    return subjectCount - index + 1;
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let distributedHours = 0;
  const plan = parsedSubjects.map((subject, index) => {
    if (index === parsedSubjects.length - 1) {
      const remainingHours = roundToOneDecimal(parsedTotalHours - distributedHours);
      return {
        subject,
        hours: remainingHours < 0 ? 0 : remainingHours,
      };
    }

    const allocatedHours = roundToOneDecimal((parsedTotalHours * weights[index]) / totalWeight);
    distributedHours += allocatedHours;

    return {
      subject,
      hours: allocatedHours,
    };
  });

  return res.status(200).json(plan);
});

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
