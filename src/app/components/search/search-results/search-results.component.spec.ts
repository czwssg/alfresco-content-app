import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchResultsComponent } from './search-results.component';
import { AppTestingModule } from '../../../testing/app-testing.module';
import { AppSearchResultsModule } from '../search-results.module';
import { CoreModule, AppConfigService } from '@alfresco/adf-core';
import { Store } from '@ngrx/store';
import { NavigateToFolder } from '../../../store/actions';
import { Pagination } from '@alfresco/js-api';
import { SearchQueryBuilderService } from '@alfresco/adf-content-services';

fdescribe('SearchComponent', () => {
  let component: SearchResultsComponent;
  let fixture: ComponentFixture<SearchResultsComponent>;
  let config: AppConfigService;
  let store: Store<any>;
  let queryBuilder: SearchQueryBuilderService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule.forRoot(), AppTestingModule, AppSearchResultsModule]
    });

    config = TestBed.get(AppConfigService);
    store = TestBed.get(Store);
    queryBuilder = TestBed.get(SearchQueryBuilderService);

    fixture = TestBed.createComponent(SearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should return null if formatting invalid query', () => {
    expect(component.formatSearchQuery(null)).toBeNull();
    expect(component.formatSearchQuery('')).toBeNull();
  });

  it('should use original user input if text contains colons', () => {
    const query = 'TEXT:test OR TYPE:folder';
    expect(component.formatSearchQuery(query)).toBe(query);
  });

  it('should use original user input if text contains quotes', () => {
    const query = `"Hello World"`;
    expect(component.formatSearchQuery(query)).toBe(query);
  });

  it('should format user input according to the configuration fields', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name', 'cm:title']
      }
    };

    const query = component.formatSearchQuery('hello');
    expect(query).toBe(`(cm:name:"hello*" OR cm:title:"hello*")`);
  });

  it('should format user input as cm:name if configuration not provided', () => {
    config.config = {
      search: {
        'aca:fields': undefined
      }
    };

    const query = component.formatSearchQuery('hello');
    expect(query).toBe(`(cm:name:"hello*")`);
  });

  it('should use AND operator when conjunction has no operators', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name']
      }
    };

    const query = component.formatSearchQuery('big yellow banana');

    expect(query).toBe(
      `(cm:name:"big*") AND (cm:name:"yellow*") AND (cm:name:"banana*")`
    );
  });

  it('should support conjunctions with AND operator', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name', 'cm:title']
      }
    };

    const query = component.formatSearchQuery('big AND yellow AND banana');

    expect(query).toBe(
      `(cm:name:"big*" OR cm:title:"big*") AND (cm:name:"yellow*" OR cm:title:"yellow*") AND (cm:name:"banana*" OR cm:title:"banana*")`
    );
  });

  it('should support conjunctions with OR operator', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name', 'cm:title']
      }
    };

    const query = component.formatSearchQuery('big OR yellow OR banana');

    expect(query).toBe(
      `(cm:name:"big*" OR cm:title:"big*") OR (cm:name:"yellow*" OR cm:title:"yellow*") OR (cm:name:"banana*" OR cm:title:"banana*")`
    );
  });

  it('should support exact term matching with default fields', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name', 'cm:title']
      }
    };

    const query = component.formatSearchQuery('=orange');

    expect(query).toBe(`(=cm:name:"orange" OR =cm:title:"orange")`);
  });

  it('should support exact term matching with operators', () => {
    config.config = {
      search: {
        'aca:fields': ['cm:name', 'cm:title']
      }
    };

    const query = component.formatSearchQuery('=test1.pdf or =test2.pdf');

    expect(query).toBe(
      `(=cm:name:"test1.pdf" OR =cm:title:"test1.pdf") or (=cm:name:"test2.pdf" OR =cm:title:"test2.pdf")`
    );
  });

  it('should navigate to folder on double click', () => {
    const node: any = {
      entry: {
        isFolder: true
      }
    };

    spyOn(store, 'dispatch').and.stub();

    component.onNodeDoubleClick(node);

    expect(store.dispatch).toHaveBeenCalledWith(new NavigateToFolder(node));
  });

  it('should preview file node on double click', () => {
    const node: any = {
      entry: {
        isFolder: false
      }
    };

    spyOn(component, 'showPreview').and.stub();

    component.onNodeDoubleClick(node);

    expect(component.showPreview).toHaveBeenCalledWith(node);
  });

  it('should re-run search on pagination change', () => {
    const page = new Pagination({
      maxItems: 10,
      skipCount: 0
    });

    spyOn(queryBuilder, 'update').and.stub();

    component.onPaginationChanged(page);

    expect(queryBuilder.paging).toEqual({
      maxItems: 10,
      skipCount: 0
    });
    expect(queryBuilder.update).toHaveBeenCalled();
  });
});
