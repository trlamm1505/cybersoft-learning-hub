import { test, expect } from '../fixtures/base.fixture';
import { CatalogPage } from '../pages/catalog.page';
import { MOCK_LESSONS } from '../../../../learning-hub/FE/src/data/mockLessons';
test('catalog: danh sách, lọc độ khó, tìm kiếm và đặt lại', async ({ page, authenticated }) => {
  const catalog = new CatalogPage(page);
  await catalog.navigate('/catalog');
  await expect(catalog.lessonButtons).toHaveCount(MOCK_LESSONS.length);
  for (const [label, difficulty] of [['Cơ bản', 'Beginner'], ['Trung bình', 'Intermediate'], ['Nâng cao', 'Advanced']]) {
    await catalog.difficulty(label).click();
    await expect(catalog.difficulty(label)).toHaveAttribute('aria-selected', 'true');
    await expect(catalog.lessonButtons).toHaveCount(MOCK_LESSONS.filter(l => l.difficulty === difficulty).length);
  }
  await catalog.difficulty('Tất cả độ khó').click();
  await catalog.search.fill(MOCK_LESSONS[0].title);
  await expect(catalog.lessonButtons).toHaveCount(1);
  await catalog.search.fill('DAY08_NO_MATCH_928456');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy bài học phù hợp', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
  await expect(catalog.search).toHaveValue('');
  await expect(catalog.lessonButtons).toHaveCount(MOCK_LESSONS.length);
});
