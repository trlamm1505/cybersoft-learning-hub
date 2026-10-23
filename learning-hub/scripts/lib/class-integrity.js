/**
 * Toàn vẹn tham chiếu của lớp học (classrooms): gỡ id học viên/giảng viên không còn tồn tại khỏi studentIds, teacherIds
 * và chuyển teacherId (giảng viên chính) sang người còn lại đầu tiên, hoặc bỏ trống nếu không còn ai.
 * Dùng chung cho các script seed/dọn dẹp để không bao giờ để lại id "ma" làm kẹt việc phân công giảng viên.
 */

/** Danh sách giảng viên của lớp theo thứ tự hiển thị: teacherIds (nếu có), không thì teacherId cũ. */
function teacherList(cls) {
  const ids = Array.isArray(cls.teacherIds) && cls.teacherIds.length ? cls.teacherIds : cls.teacherId ? [cls.teacherId] : [];
  return [...new Set(ids.map(String))];
}

/**
 * Bản cập nhật cho một lớp, hoặc null nếu lớp đã sạch. isAlive(id) cho biết id user còn tồn tại (và với giảng viên: còn
 * là tài khoản giảng viên). fitsClass(id, cls) loại học viên đã đổi khối (vd 3-5 → Người đi làm) khỏi lớp thuộc khối cũ.
 */
function repairClassRefs(cls, isAlive, isTeacherAlive = isAlive, fitsClass = () => true) {
  const $set = {};
  const $unset = {};
  const students = (cls.studentIds || []).map(String);
  const keepStudents = students.filter((id) => isAlive(id) && fitsClass(id, cls));
  if (keepStudents.length !== students.length) $set.studentIds = keepStudents;

  const teachers = teacherList(cls);
  const keepTeachers = teachers.filter((id) => isTeacherAlive(id));
  if (Array.isArray(cls.teacherIds) && keepTeachers.length !== cls.teacherIds.length) $set.teacherIds = keepTeachers;
  if (cls.teacherId && !isTeacherAlive(String(cls.teacherId))) {
    if (keepTeachers[0]) $set.teacherId = keepTeachers[0];
    else $unset.teacherId = 1;
  }
  const update = {};
  if (Object.keys($set).length) update.$set = $set;
  if (Object.keys($unset).length) update.$unset = $unset;
  return Object.keys(update).length ? update : null;
}

/** Quét mọi lớp và sửa tham chiếu tới user đã bị xóa (hoặc giảng viên không còn là TEACHER). Trả số lớp đã sửa. */
async function repairAllClasses(db, { dryRun = false, log = () => {} } = {}) {
  const users = await db.collection('users').find({}, { projection: { _id: 1, role: 1, ageGroup: 1 } }).toArray();
  const ageOf = new Map(users.map((u) => [String(u._id), u.ageGroup]));
  // Lớp phổ thông có khối: học viên đã có khối khác thì không còn thuộc lớp (khóa Người đi làm không lưu studentIds nên bỏ qua).
  const fitsClass = (id, c) => !c.ageGroup || !ageOf.get(id) || ageOf.get(id) === c.ageGroup;
  const alive = new Set(users.map((u) => String(u._id)));
  const teachers = new Set(users.filter((u) => u.role === 'TEACHER').map((u) => String(u._id)));
  const classes = db.collection('classrooms');
  let fixed = 0;
  for (const c of await classes.find({}).toArray()) {
    const update = repairClassRefs(c, (id) => alive.has(id), (id) => teachers.has(id), fitsClass);
    if (!update) continue;
    fixed++;
    log(`${dryRun ? '(dry-run) ' : ''}${c.code || c.name}: ${JSON.stringify(update)}`);
    if (!dryRun) await classes.updateOne({ _id: c._id }, update);
  }
  return fixed;
}

module.exports = { teacherList, repairClassRefs, repairAllClasses };
