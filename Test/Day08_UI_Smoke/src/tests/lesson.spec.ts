import { test, expect } from '../fixtures/base.fixture';
import { CatalogPage } from '../pages/catalog.page';
test('đăng nhập rồi xem nội dung bài học', async ({ page, seed, authenticated }) => {
  const catalog = new CatalogPage(page);
  await catalog.navigate('/catalog');
  await catalog.openLesson(seed.lessonTitle);
  await expect(page).toHaveURL(new RegExp(`/detail/${seed.lessonId}$`));
  await expect(page.getByRole('heading', { level: 1, name: seed.lessonTitle, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Mục tiêu/ })).toBeVisible();
});
