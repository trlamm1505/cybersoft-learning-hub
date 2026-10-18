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
 * là tài khoản giảng viên).
 */
function repairClassRefs(cls, isAlive, isTeacherAlive = isAlive) {
  const $set = {};
  const $unset = {};
  const students = (cls.studentIds || []).map(String);
  const keepStudents = students.filter((id) => isAlive(id));
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
  const users = await db.collection('users').find({}, { projection: { _id: 1, role: 1 } }).toArray();
  const alive = new Set(users.map((u) => String(u._id)));
  const teachers = new Set(users.filter((u) => u.role === 'TEACHER').map((u) => String(u._id)));
  const classes = db.collection('classrooms');
  let fixed = 0;
  for (const c of await classes.find({}).toArray()) {
    const update = repairClassRefs(c, (id) => alive.has(id), (id) => teachers.has(id));
    if (!update) continue;
    fixed++;
    log(`${dryRun ? '(dry-run) ' : ''}${c.code || c.name}: ${JSON.stringify(update)}`);
    if (!dryRun) await classes.updateOne({ _id: c._id }, update);
  }
  return fixed;
}

module.exports = { teacherList, repairClassRefs, repairAllClasses };
