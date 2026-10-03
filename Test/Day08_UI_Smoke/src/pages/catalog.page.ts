import { BasePage } from './base.page';
export class CatalogPage extends BasePage {
  readonly search = this.page.getByRole('searchbox', { name: 'Tìm kiếm bài học' });
  readonly lessonButtons = this.page.getByRole('button', { name: /^Vào xem bài học / });
  difficulty(name: string) { return this.page.getByRole('tab', { name, exact: true }); }
  async openLesson(title: string) {
    await this.search.fill(title);
    await this.page.getByRole('button', { name: `Vào xem bài học ${title}`, exact: true }).click();
  }
}
