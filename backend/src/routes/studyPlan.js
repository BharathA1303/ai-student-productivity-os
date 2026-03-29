const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

router.post('/ai-plan', (req, res) => {
  const { subjects, totalHours } = req.body;

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: 'Subjects must be a non-empty array' });
  }

  const parsedTotalHours = Number(totalHours);

  if (!Number.isFinite(parsedTotalHours) || parsedTotalHours <= 0) {
    return res.status(400).json({ message: 'Total hours must be a positive number' });
  }

  const now = Date.now();
  const preparedSubjects = subjects.map((item, index) => {
    const subject = typeof item?.subject === 'string' ? item.subject.trim() : '';
    const priority = Number(item?.priority);
    const examTimestamp = Date.parse(item?.examDate);

    if (!subject) {
      return { error: `Subject at index ${index} must be a non-empty string` };
    }

    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return { error: `Priority for ${subject} must be an integer between 1 and 5` };
    }

    if (Number.isNaN(examTimestamp)) {
      return { error: `Exam date for ${subject} must be a valid ISO date` };
    }

    const rawDaysLeft = Math.ceil((examTimestamp - now) / MS_PER_DAY);
    const daysLeft = rawDaysLeft <= 0 ? 1 : rawDaysLeft;
    const score = priority + 1 / daysLeft;

    return {
      subject,
      priority,
      examDate: new Date(examTimestamp).toISOString(),
      daysLeft,
      score,
    };
  });

  const invalidSubject = preparedSubjects.find((item) => item.error);
  if (invalidSubject) {
    return res.status(400).json({ message: invalidSubject.error });
  }

  const scoreSum = preparedSubjects.reduce((sum, item) => sum + item.score, 0);

  if (scoreSum <= 0) {
    return res.status(400).json({ message: 'Unable to calculate study plan scores' });
  }

  let distributedHours = 0;
  const plan = preparedSubjects.map((item, index) => {
    if (index === preparedSubjects.length - 1) {
      const remainingHours = roundToOneDecimal(parsedTotalHours - distributedHours);

      return {
        subject: item.subject,
        hours: remainingHours < 0 ? 0 : remainingHours,
      };
    }

    const allocatedHours = roundToOneDecimal((parsedTotalHours * item.score) / scoreSum);
    distributedHours += allocatedHours;

    return {
      subject: item.subject,
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
