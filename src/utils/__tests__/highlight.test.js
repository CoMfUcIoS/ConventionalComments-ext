/**
 * Copyright (c) 2025 Ioannis Karasavvaidis
 * This file is part of ConventionalComments-ext
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

// Mock modules before importing highlight.js
jest.mock('../debug', () => ({
  debug: jest.fn(),
}));

jest.mock('../../state', () => ({
  customLabels: [],
  customLabelColors: {},
  customDecorationColors: {},
}));

// Import the actual highlight function to test
import { highlightConventionalComments } from '../highlight';

// Test suite for non-destructive highlighting
describe('Non-Destructive Text Node Traversal', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'comment-body';
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('DOM Structure Preservation', () => {
    test('should preserve basic HTML structure after highlighting', () => {
      container.innerHTML = '<p>praise: This is a comment</p>';
      highlightConventionalComments([container]);
      
      // Verify structure is still intact
      expect(container.querySelector('p')).toBeTruthy();
      expect(container.textContent).toContain('This is a comment');
    });

    test('should preserve markdown formatting (bold, italic)', () => {
      container.innerHTML = '<p>praise: This is <strong>bold</strong> text with <em>italic</em> formatting.</p>';
      highlightConventionalComments([container]);
      
      // Verify markdown elements still exist
      const strong = container.querySelector('strong');
      const em = container.querySelector('em');
      expect(strong).toBeTruthy();
      expect(em).toBeTruthy();
      expect(strong.textContent).toBe('bold');
      expect(em.textContent).toBe('italic');
    });

    test('should preserve link elements with href attributes', () => {
      container.innerHTML = '<p>issue: <a href="https://github.com/issues/123">#123</a></p>';
      highlightConventionalComments([container]);
      
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.href).toContain('123');
      expect(link.textContent).toBe('#123');
    });

    test('should NOT replace entire DOM tree', () => {
      const originalClass = 'original-structure';
      container.innerHTML = `<div class="${originalClass}"><p>praise: Keep this</p></div>`;
      const original = container.querySelector(`.${originalClass}`);
      
      highlightConventionalComments([container]);
      
      // Verify the original div is still there
      expect(container.querySelector(`.${originalClass}`)).toBeTruthy();
      expect(original).toBe(container.querySelector(`.${originalClass}`));
    });
  });

  describe('Label Highlighting Creation', () => {
    test('should create wrapper span for detected labels', () => {
      container.innerHTML = '<p>praise: Good work</p>';
      highlightConventionalComments([container]);
      
      // Verify wrapper span was created
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });

    test('should create label span with correct class', () => {
      container.innerHTML = '<p>praise: Test</p>';
      highlightConventionalComments([container]);
      
      const labelSpan = container.querySelector('.cc-highlight-praise');
      expect(labelSpan).toBeTruthy();
      expect(labelSpan.textContent).toBe('praise');
    });

    test('should apply background color to label', () => {
      container.innerHTML = '<p>issue: Problem found</p>';
      highlightConventionalComments([container]);
      
      const labelSpan = container.querySelector('.cc-highlight-issue');
      expect(labelSpan).toBeTruthy();
      expect(labelSpan.style.backgroundColor).toBeTruthy();
    });

    test('should highlight all default labels', () => {
      const labels = ['praise', 'nitpick', 'suggestion', 'issue', 'todo', 'question', 'thought', 'chore', 'note'];
      
      labels.forEach((label) => {
        const testContainer = document.createElement('div');
        testContainer.className = 'comment-body';
        testContainer.innerHTML = `<p>${label}: Test message</p>`;
        document.body.appendChild(testContainer);
        
        highlightConventionalComments([testContainer]);
        
        const labelSpan = testContainer.querySelector(`.cc-highlight-${label}`);
        expect(labelSpan).toBeTruthy();
        expect(labelSpan.textContent).toBe(label);
        
        document.body.removeChild(testContainer);
      });
    });

    test('should be case-insensitive', () => {
      container.innerHTML = '<p>PRAISE: Test</p>';
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Decoration Highlighting', () => {
    test('should create decoration spans for (non-blocking)', () => {
      container.innerHTML = '<p>praise (non-blocking): Good</p>';
      highlightConventionalComments([container]);
      
      const decorationSpan = container.querySelector('.cc-highlight-non-blocking');
      expect(decorationSpan).toBeTruthy();
      expect(decorationSpan.textContent).toBe('non-blocking');
    });

    test('should handle multiple decorations', () => {
      container.innerHTML = '<p>issue (blocking, security): Fix this</p>';
      highlightConventionalComments([container]);
      
      const blockingSpan = container.querySelector('.cc-highlight-blocking');
      const securitySpan = container.querySelector('.cc-highlight-security');
      
      expect(blockingSpan).toBeTruthy();
      expect(securitySpan).toBeTruthy();
    });

    test('should create decoration group span', () => {
      container.innerHTML = '<p>praise (non-blocking): Good</p>';
      highlightConventionalComments([container]);
      
      const decorationGroup = container.querySelector('.cc-decoration-group');
      expect(decorationGroup).toBeTruthy();
    });

    test('should handle empty decorations gracefully', () => {
      container.innerHTML = '<p>praise (): Test</p>';
      highlightConventionalComments([container]);
      
      // Should still highlight the label despite empty decorations
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });
  });

  describe('Code Block Protection', () => {
    test('should not highlight content inside code tags', () => {
      container.innerHTML = '<pre><code>praise: This should NOT be highlighted</code></pre>';
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      // Code block content should not be highlighted
      expect(wrapper).toBeFalsy();
      
      const code = container.querySelector('code');
      expect(code.textContent).toContain('praise: This should NOT be highlighted');
    });

    test('should not highlight content inside pre tags', () => {
      container.innerHTML = '<pre>issue: Preformatted text</pre>';
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      // Preformatted content should not be highlighted
      expect(wrapper).toBeFalsy();
    });

    test('should highlight regular content while skipping code blocks', () => {
      container.innerHTML = `
        <div>
          <p>praise: Real comment</p>
          <pre><code>praise: code block</code></pre>
        </div>
      `;
      highlightConventionalComments([container]);
      
      // First praise should be highlighted
      const wrappers = container.querySelectorAll('.cc-highlight-wrapper');
      expect(wrappers.length).toBe(1);
      
      // Code content should remain unchanged
      const code = container.querySelector('code');
      expect(code.textContent).toContain('praise: code block');
    });

    test('should skip nested code blocks', () => {
      container.innerHTML = `
        <div>
          <p>suggestion: Real</p>
          <section>
            <pre><code>suggestion: Fake</code></pre>
          </section>
        </div>
      `;
      highlightConventionalComments([container]);
      
      const wrappers = container.querySelectorAll('.cc-highlight-wrapper');
      expect(wrappers.length).toBe(1);
    });
  });

  describe('Multi-Paragraph Comments', () => {
    test('should highlight labels in second paragraph', () => {
      container.innerHTML = `
        <p>Some intro text</p>
        <p>praise: This should be highlighted</p>
      `;
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      // Label in second paragraph should be highlighted
      expect(wrapper).toBeTruthy();
      expect(wrapper.textContent).toContain('praise');
    });

    test('should handle newlines within text nodes', () => {
      container.innerHTML = '<p>Some text\npraise: After newline</p>';
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });

    test('should preserve paragraph structure', () => {
      container.innerHTML = `
        <p>Intro</p>
        <p>issue: Problem</p>
        <p>Outro</p>
      `;
      const beforeParagraphCount = container.querySelectorAll('p').length;
      
      highlightConventionalComments([container]);
      
      const afterParagraphCount = container.querySelectorAll('p').length;
      expect(afterParagraphCount).toBe(beforeParagraphCount);
    });
  });

  describe('Edge Cases', () => {
    test('should handle nested HTML structures', () => {
      container.innerHTML = '<div><section><p>suggestion: Nested</p></section></div>';
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });

    test('should skip comments inside code blocks in complex structures', () => {
      container.innerHTML = `
        <div>
          <p>praise: Real</p>
          <pre><code>praise: Fake</code></pre>
        </div>
      `;
      highlightConventionalComments([container]);
      
      const wrappers = container.querySelectorAll('.cc-highlight-wrapper');
      expect(wrappers.length).toBe(1);
    });

    test('should handle long comments', () => {
      const longText = 'x'.repeat(5000);
      container.innerHTML = `<p>praise: ${longText}</p>`;
      
      highlightConventionalComments([container]);
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
      expect(container.textContent).toContain(longText);
    });

    test('should not error with special regex characters', () => {
      container.innerHTML = '<p>praise: Special chars: $, ^, *, +, ?, [, ], (, )</p>';
      
      expect(() => {
        highlightConventionalComments([container]);
      }).not.toThrow();
      
      const wrapper = container.querySelector('.cc-highlight-wrapper');
      expect(wrapper).toBeTruthy();
    });

    test('should preserve text content before and after match', () => {
      container.innerHTML = '<p>Before praise: After</p>';
      highlightConventionalComments([container]);
      
      expect(container.textContent).toContain('Before');
      expect(container.textContent).toContain('After');
    });

    test('should handle empty text nodes gracefully', () => {
      container.innerHTML = '<p>praise: <span></span>Test</p>';
      
      expect(() => {
        highlightConventionalComments([container]);
      }).not.toThrow();
    });
  });

  describe('Markdown Compatibility', () => {
    test('should preserve mention links', () => {
      container.innerHTML = '<p>praise: <a href="/user">@reviewer</a></p>';
      highlightConventionalComments([container]);
      
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.textContent).toContain('@reviewer');
      expect(link.href).toContain('/user');
    });

    test('should preserve issue reference links', () => {
      container.innerHTML = '<p>issue: <a href="/issues/456">#456</a></p>';
      highlightConventionalComments([container]);
      
      const link = container.querySelector('a');
      expect(link).toBeTruthy();
      expect(link.href).toContain('456');
    });

    test('should preserve inline code elements', () => {
      container.innerHTML = '<p>suggestion: Use <code>const</code> keyword</p>';
      highlightConventionalComments([container]);
      
      const codeEl = container.querySelector('code');
      expect(codeEl).toBeTruthy();
      expect(codeEl.textContent).toBe('const');
    });

    test('should handle complex markdown with multiple elements', () => {
      const html = `
        <div class="markdown-body">
          <p>praise: <strong>Good</strong> work! See <a href="/issues/1">#1</a></p>
          <ul>
            <li><em>Italic</em> point</li>
            <li><code>code</code> point</li>
          </ul>
        </div>
      `;
      container.innerHTML = html;
      
      highlightConventionalComments([container]);
      
      expect(container.querySelector('strong')).toBeTruthy();
      expect(container.querySelector('a')).toBeTruthy();
      expect(container.querySelector('em')).toBeTruthy();
      expect(container.querySelector('code')).toBeTruthy();
      expect(container.querySelector('.cc-highlight-wrapper')).toBeTruthy();
    });
  });

  describe('Multiple Comments', () => {
    test('should highlight first comment in container with multiple labels', () => {
      container.innerHTML = `
        <p>praise: First comment</p>
        <p>issue: Second comment</p>
      `;
      highlightConventionalComments([container]);
      
      const wrappers = container.querySelectorAll('.cc-highlight-wrapper');
      expect(wrappers.length).toBeGreaterThanOrEqual(1);
    });

    test('should highlight labels in multiple containers', () => {
      const container1 = document.createElement('div');
      container1.className = 'comment-body';
      container1.innerHTML = '<p>praise: First</p>';
      
      const container2 = document.createElement('div');
      container2.className = 'comment-body';
      container2.innerHTML = '<p>issue: Second</p>';
      
      document.body.appendChild(container1);
      document.body.appendChild(container2);
      
      highlightConventionalComments([container1, container2]);
      
      expect(container1.querySelector('.cc-highlight-praise')).toBeTruthy();
      expect(container2.querySelector('.cc-highlight-issue')).toBeTruthy();
      
      document.body.removeChild(container1);
      document.body.removeChild(container2);
    });
  });

  describe('Performance', () => {
    test('should process 50+ comments efficiently', () => {
      for (let i = 0; i < 50; i++) {
        const p = document.createElement('p');
        p.textContent = `praise: Comment ${i}`;
        container.appendChild(p);
      }
      
      const startTime = performance.now();
      highlightConventionalComments([container]);
      const duration = performance.now() - startTime;
      
      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
      
      const wrappers = container.querySelectorAll('.cc-highlight-wrapper');
      expect(wrappers.length).toBeGreaterThan(0);
    });

    test('should handle rapid sequential calls', () => {
      container.innerHTML = '<p>issue: Test</p>';
      
      expect(() => {
        for (let i = 0; i < 10; i++) {
          highlightConventionalComments([container]);
        }
      }).not.toThrow();
    });
  });

  describe('Acceptance Criteria Validation', () => {
    test('AC1: DOM structure is preserved', () => {
      const originalHTML = '<div><strong>Important</strong> praise: Good</div>';
      container.innerHTML = originalHTML;
      const originalStructure = container.querySelector('strong');
      
      highlightConventionalComments([container]);
      
      expect(container.querySelector('strong')).toBeTruthy();
      expect(originalStructure).toBe(container.querySelector('strong'));
    });

    test('AC2: Only text nodes are analyzed (no element replacement)', () => {
      container.innerHTML = '<p>praise: <em>emphasis</em></p>';
      const emElement = container.querySelector('em');
      
      highlightConventionalComments([container]);
      
      // EM element should still be there, not replaced
      expect(container.querySelector('em')).toBe(emElement);
    });

    test('AC3: No HTML elements are replaced or removed', () => {
      container.innerHTML = '<div><span id="test">praise: Content</span></div>';
      const originalSpan = container.querySelector('#test');
      
      highlightConventionalComments([container]);
      
      // Span should still exist
      expect(container.querySelector('#test')).toBeTruthy();
      expect(originalSpan).toBe(container.querySelector('#test'));
    });

    test('AC4: Code blocks with triple backticks remain untouched', () => {
      container.innerHTML = `
        <pre><code>
praise: This is in a code block
        </code></pre>
      `;
      const codeContent = container.querySelector('code').textContent;
      
      highlightConventionalComments([container]);
      
      // Code block should not be highlighted
      expect(container.querySelector('.cc-highlight-wrapper')).toBeFalsy();
      expect(container.querySelector('code').textContent).toBe(codeContent);
    });

    test('AC5: Markdown formatting remains functional', () => {
      container.innerHTML = `
        <p>praise: <strong>Bold</strong>, <em>italic</em>, <a href="/test">link</a></p>
      `;
      
      highlightConventionalComments([container]);
      
      const strong = container.querySelector('strong');
      const em = container.querySelector('em');
      const link = container.querySelector('a');
      
      expect(strong).toBeTruthy();
      expect(em).toBeTruthy();
      expect(link).toBeTruthy();
      expect(link.href).toContain('/test');
      expect(strong.textContent).toBe('Bold');
      expect(em.textContent).toBe('italic');
    });
  });
});
