/**
 * Medication Schedule & Prescription Duration Tracking Utility
 * Calculates day-wise prescription progress, active courses, remaining days,
 * and automatically transitions expired courses to history.
 */

/**
 * Parse duration string into number of days.
 * Examples:
 * - "3 Days" -> 3
 * - "5 Days" -> 5
 * - "7 Days (1 Wk)" -> 7
 * - "10 Days" -> 10
 * - "14 Days (2 Wks)" -> 14
 * - "30 Days (1 Mo)" -> 30
 * - "60 Days (2 Mos)" -> 60
 * - "90 Days (3 Mos)" -> 90
 * - "5" -> 5
 * - "1 Week" -> 7
 * - "SOS / As Needed" -> 0 (flagged as SOS)
 */
export const parseDurationDays = (durationStr) => {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  const trimmed = durationStr.trim().toLowerCase();
  
  if (trimmed.includes('sos') || trimmed.includes('needed') || trimmed.includes('as req')) {
    return 0; // Handled as SOS
  }

  // Check for weeks
  const weekMatch = trimmed.match(/(\d+)\s*(wk|week|weeks)/);
  if (weekMatch) {
    return parseInt(weekMatch[1], 10) * 7;
  }

  // Check for months
  const monthMatch = trimmed.match(/(\d+)\s*(mo|month|months)/);
  if (monthMatch) {
    return parseInt(monthMatch[1], 10) * 30;
  }

  // Check for days or raw number
  const dayMatch = trimmed.match(/(\d+)\s*(day|days|d)?/);
  if (dayMatch) {
    return parseInt(dayMatch[1], 10);
  }

  return 0;
};

/**
 * Format food relation with friendly text and icon cues
 */
export const getFoodRelationInfo = (beforeAfter = '') => {
  const lower = (beforeAfter || '').toLowerCase().trim();
  if (lower.includes('after meal') || lower.includes('post') || lower.includes('after food')) {
    return { label: 'After Meals', sub: 'Take after eating', icon: 'utensils', type: 'post' };
  }
  if (lower.includes('before meal') || lower.includes('pre') || lower.includes('empty stomach')) {
    return { label: 'Before Meals', sub: 'Take on empty stomach', icon: 'clock', type: 'pre' };
  }
  if (lower.includes('with meal') || lower.includes('with food')) {
    return { label: 'With Meals', sub: 'Take during meals', icon: 'utensils', type: 'with' };
  }
  if (lower.includes('breakfast')) {
    return { label: 'After Breakfast', sub: 'Morning with food', icon: 'sunrise', type: 'morning' };
  }
  if (lower.includes('dinner')) {
    return { label: 'After Dinner', sub: 'Evening with food', icon: 'moon', type: 'night' };
  }
  if (lower.includes('bedtime') || lower.includes('sleep')) {
    return { label: 'At Bedtime', sub: 'Before sleep', icon: 'moon', type: 'night' };
  }
  return { label: beforeAfter || 'As Advised', sub: 'Follow doctor guidance', icon: 'info', type: 'normal' };
};

/**
 * Parse dosage frequency/slots
 */
export const getDosageTimingSlots = (whenToTake = '', time = '') => {
  const val = `${whenToTake || ''} ${time || ''}`.toLowerCase();
  const slots = [];

  const isSos = val.includes('sos') || val.includes('needed') || val.includes('as req');
  if (isSos) {
    return [{ id: 'sos', label: 'As Needed (SOS)', timeSlot: 'SOS', icon: 'alert', color: 'amber' }];
  }

  if (val.includes('1-1-1') || val.includes('three times') || val.includes('thrice')) {
    slots.push({ id: 'morning', label: 'Morning', timeSlot: '08:00 AM', code: '1', icon: 'sunrise', color: 'amber' });
    slots.push({ id: 'afternoon', label: 'Afternoon', timeSlot: '01:30 PM', code: '1', icon: 'sun', color: 'orange' });
    slots.push({ id: 'night', label: 'Night', timeSlot: '08:30 PM', code: '1', icon: 'moon', color: 'indigo' });
    return slots;
  }

  if (val.includes('1-0-1') || (val.includes('morning') && val.includes('night')) || val.includes('twice')) {
    slots.push({ id: 'morning', label: 'Morning', timeSlot: '08:00 AM', code: '1', icon: 'sunrise', color: 'amber' });
    slots.push({ id: 'night', label: 'Night', timeSlot: '08:30 PM', code: '1', icon: 'moon', color: 'indigo' });
    return slots;
  }

  if (val.includes('1-0-0') || val.includes('pre meals (1-0-0)') || (val.includes('morning') && !val.includes('night'))) {
    slots.push({ id: 'morning', label: 'Morning', timeSlot: '08:00 AM', code: '1-0-0', icon: 'sunrise', color: 'amber' });
    return slots;
  }

  if (val.includes('0-1-0') || val.includes('afternoon only')) {
    slots.push({ id: 'afternoon', label: 'Afternoon', timeSlot: '01:30 PM', code: '0-1-0', icon: 'sun', color: 'orange' });
    return slots;
  }

  if (val.includes('0-0-1') || val.includes('night (0-0-1)') || val.includes('at bedtime')) {
    slots.push({ id: 'night', label: 'Night', timeSlot: '08:30 PM', code: '0-0-1', icon: 'moon', color: 'indigo' });
    return slots;
  }

  if (val.includes('once daily') || val.includes('daily')) {
    slots.push({ id: 'daily', label: 'Once Daily', timeSlot: 'Morning', code: '1-0-0', icon: 'sunrise', color: 'teal' });
    return slots;
  }

  // Fallback custom text
  const label = whenToTake || time || 'Once Daily';
  slots.push({ id: 'custom', label, timeSlot: 'As Prescribed', code: '', icon: 'clock', color: 'teal' });
  return slots;
};

/**
 * Calculate course progress and active status for a given prescription record.
 */
export const getPrescriptionSchedule = (record) => {
  if (!record) {
    return {
      status: 'invalid',
      isActive: false,
      isCompleted: true,
      totalDays: 0,
      currentDay: 0,
      remainingDays: 0,
      progressPercent: 0,
      startDate: null,
      endDate: null,
      hasSos: false,
      medicinesSchedule: []
    };
  }

  const rawDate = record.date || record.visitDate || record.createdAt;
  const start = rawDate ? new Date(rawDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  const medicines = record.medicines || [];

  // Parse each individual medicine duration and status
  let maxCourseDays = 0;
  let hasSos = false;

  const medicinesSchedule = medicines.map((med) => {
    const medDays = parseDurationDays(med.duration);
    const isSos = (med.duration || '').toLowerCase().includes('sos') ||
                  (med.duration || '').toLowerCase().includes('needed') ||
                  (med.whenToTake || '').toLowerCase().includes('sos');

    if (isSos) hasSos = true;
    if (medDays > maxCourseDays) maxCourseDays = medDays;

    // Per-medicine end date and active status
    const medEnd = new Date(start.getTime() + Math.max(0, medDays - 1) * 86400000);
    medEnd.setHours(23, 59, 59, 999);

    const diffDaysFromStart = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const medCurrentDay = diffDaysFromStart + 1;
    const medRemaining = Math.max(0, medDays - medCurrentDay + 1);

    const isMedActive = isSos ? true : (medDays > 0 && medCurrentDay >= 1 && medCurrentDay <= medDays);
    const isMedCompleted = !isSos && medDays > 0 && medCurrentDay > medDays;

    return {
      ...med,
      parsedDays: medDays,
      isSos,
      currentDay: Math.min(Math.max(1, medCurrentDay), medDays || 1),
      remainingDays: medRemaining,
      isActive: isMedActive,
      isCompleted: isMedCompleted,
      timingSlots: getDosageTimingSlots(med.whenToTake, med.time),
      foodInfo: getFoodRelationInfo(med.beforeAfter)
    };
  });

  // If no day duration was found but medicines exist, fallback to 3 days (unless SOS only)
  if (maxCourseDays === 0 && !hasSos && medicines.length > 0) {
    maxCourseDays = 3;
  }

  // End date is (start + maxCourseDays - 1)
  const endDate = new Date(start.getTime() + Math.max(0, maxCourseDays - 1) * 86400000);
  endDate.setHours(23, 59, 59, 999);

  // Day calculations
  const diffDays = Math.floor((today.getTime() - start.getTime()) / 86400000);
  const currentDay = diffDays + 1; // 1-indexed (Day 1 on prescription day)
  const remainingDays = Math.max(0, maxCourseDays - currentDay + 1);

  // Status flags:
  // Active if today is within [start, endDate] and currentDay <= maxCourseDays
  const isUpcoming = currentDay < 1;
  const isCompleted = maxCourseDays > 0 && currentDay > maxCourseDays;
  const isActive = (maxCourseDays > 0 && currentDay >= 1 && currentDay <= maxCourseDays) || (maxCourseDays === 0 && hasSos);

  const progressPercent = maxCourseDays > 0
    ? Math.min(100, Math.max(0, Math.round((Math.min(currentDay, maxCourseDays) / maxCourseDays) * 100)))
    : (isCompleted ? 100 : 0);

  let statusText = 'active';
  if (isCompleted) statusText = 'completed';
  else if (isUpcoming) statusText = 'upcoming';
  else if (maxCourseDays === 0 && hasSos) statusText = 'sos_active';

  return {
    status: statusText,
    isActive,
    isCompleted,
    isUpcoming,
    totalDays: maxCourseDays,
    currentDay: Math.min(Math.max(1, currentDay), maxCourseDays || 1),
    remainingDays,
    progressPercent,
    startDate: start,
    endDate,
    hasSos,
    medicinesSchedule
  };
};

/**
 * Filter and categorize patient's medical history into Active Ongoing Prescriptions
 * and Completed / Expired Prescription Archive.
 */
export const categorizePrescriptions = (medicalHistory = []) => {
  const activePrescriptions = [];
  const completedPrescriptions = [];
  const upcomingPrescriptions = [];
  const todayMedicines = [];

  (medicalHistory || []).forEach((record, index) => {
    // Only process records that contain prescribed medicines
    if (!record.medicines || record.medicines.length === 0) {
      return;
    }

    const schedule = getPrescriptionSchedule(record);
    const enrichedRecord = {
      ...record,
      schedule,
      uniqueKey: record.visitId || `rec-${index}`
    };

    if (schedule.isActive) {
      activePrescriptions.push(enrichedRecord);

      // Collect medicines that are active today for daily schedule view
      schedule.medicinesSchedule.forEach((med) => {
        if (med.isActive) {
          todayMedicines.push({
            prescriptionId: enrichedRecord.uniqueKey,
            doctorName: record.doctorName,
            clinicName: record.clinicName,
            diagnosis: record.diagnosis,
            currentDay: med.currentDay,
            totalDays: med.parsedDays,
            remainingDays: med.remainingDays,
            name: med.name,
            strength: med.strength,
            instructions: med.instructions,
            isSos: med.isSos,
            timingSlots: med.timingSlots,
            foodInfo: med.foodInfo
          });
        }
      });
    } else if (schedule.isCompleted) {
      completedPrescriptions.push(enrichedRecord);
    } else if (schedule.isUpcoming) {
      upcomingPrescriptions.push(enrichedRecord);
    }
  });

  return {
    activePrescriptions,
    completedPrescriptions,
    upcomingPrescriptions,
    todayMedicines,
    activeCount: activePrescriptions.length,
    completedCount: completedPrescriptions.length,
    totalCount: activePrescriptions.length + completedPrescriptions.length + upcomingPrescriptions.length
  };
};
