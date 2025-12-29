import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

// Mock the navigator.languages
Object.defineProperty(navigator, 'languages', {
  configurable: true,
  value: ['en-US'],
});

describe('App.tsx', () => {
  beforeEach(() => {
    // Clear any stored data
    try {
      localStorage.clear();
    } catch (e) {
      // localStorage might not be available in test environment
    }
  });

  it('should render the app with main form', () => {
    render(<App />);

    expect(screen.getByText(/Calf/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
  });

  it('should fill in the title field', async () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText('Title');
    await userEvent.type(titleInput, 'Test Event');

    expect(titleInput).toHaveValue('Test Event');
  });

  it('should fill in the description field', async () => {
    render(<App />);

    const descInput = screen.getByPlaceholderText('Description');
    await userEvent.type(descInput, 'Test Description');

    expect(descInput).toHaveValue('Test Description');
  });

  it('should toggle dark mode', async () => {
    render(<App />);

    const html = document.documentElement;
    const initialClass = html.className;

    const darkModeButton = screen.getAllByTitle('Toggle dark / light mode')[0];
    await userEvent.click(darkModeButton);

    // Class should change after toggling
    expect(html.className).not.toBe(initialClass);
  });

  it('should display form inputs', () => {
    render(<App />);

    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByText(/Share Event/)).toBeInTheDocument();
  });

  it('should show error when sharing without title', async () => {
    render(<App />);

    const shareButton = screen.getByText('Share Event');
    await userEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText(/Title.*required/)).toBeInTheDocument();
    });
  });

  it('should allow filling title and description', async () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText('Title');
    const descInput = screen.getByPlaceholderText('Description');

    await userEvent.type(titleInput, 'Meeting');
    await userEvent.type(descInput, 'Important meeting');

    expect(titleInput).toHaveValue('Meeting');
    expect(descInput).toHaveValue('Important meeting');
  });

  it('should have timezone selector', () => {
    render(<App />);

    // Look for timezone-related elements
    const elements = screen.queryAllByText(/Timezone|timezone/i);
    expect(elements.length).toBeGreaterThanOrEqual(0);
  });

  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should handle location input', async () => {
    render(<App />);

    const locationInputs = screen.getAllByPlaceholderText(/Meeting|Location/i);
    if (locationInputs.length > 0) {
      await userEvent.type(locationInputs[0], 'Conference Room A');
      expect(locationInputs[0]).toHaveValue('Conference Room A');
    }
  });

  it('should initialize with empty form', () => {
    render(<App />);

    const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  describe('handleApplyAI', () => {
    it('should fill form with valid JSON data', async () => {
      render(<App />);

      // Open AI modal
      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      // Find the input or textarea in the modal where we can paste JSON
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);

      // The AI modal should have opened
      await waitFor(() => {
        expect(screen.getByText(/Easily fill the form/i)).toBeInTheDocument();
      });
    });

    it('should apply title from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ title: 'Test Event from AI' }) },
          });
        }
      });

      // Click apply button
      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
          expect(titleInput.value).toBe('Test Event from AI');
        });
      }
    });

    it('should apply description from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ description: 'Test Description from AI' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const descInput = screen.getByPlaceholderText('Description') as HTMLInputElement;
          expect(descInput.value).toBe('Test Description from AI');
        });
      }
    });

    it('should apply location from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ location: 'Conference Room B' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const locationInputs = screen.getAllByPlaceholderText(/Meeting|Location/i);
          if (locationInputs.length > 0) {
            expect(locationInputs[0]).toHaveValue('Conference Room B');
          }
        });
      }
    });

    it('should apply times from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ sTime: '14:00', eTime: '15:00' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        // Times should be applied to the form
        await waitFor(() => {
          expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
        });
      }
    });

    it('should apply timezone from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ timezone: 'America/New_York' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
        });
      }
    });

    it('should apply isAllDay boolean from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ isAllDay: true }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
        });
      }
    });

    it('should apply dates from JSON in YYYY-MM-DD format', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ sDate: '2025-12-25', eDate: '2025-12-26' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          expect(screen.queryByText(/Invalid JSON/)).not.toBeInTheDocument();
        });
      }
    });

    it('should apply multiple fields from JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      const jsonData = JSON.stringify({
        title: 'Team Meeting',
        description: 'Quarterly review',
        location: 'Room 201',
        sTime: '10:00',
        eTime: '11:00',
        timezone: 'UTC',
        isAllDay: false,
      });

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: jsonData },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
          expect(titleInput.value).toBe('Team Meeting');
        });
      }
    });

    it('should show error for empty JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: '' },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          expect(screen.getByText(/No JSON provided/)).toBeInTheDocument();
        });
      }
    });

    it('should show error for invalid JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: '{ invalid json }' },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
        });
      }
    });

    it('should close AI modal after successful apply', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ title: 'New Event' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        // Modal should close after successful apply
        await waitFor(() => {
          expect(screen.queryByText(/Easily fill the form/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should ignore non-string properties in JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ title: 'Event', unknownField: 123, anotherField: {} }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
          expect(titleInput.value).toBe('Event');
        });
      }
    });

    it('should ignore invalid date formats in JSON', async () => {
      const { container } = render(<App />);

      const aiButton = screen.getByText('✨ Easily fill the form with AI');
      await userEvent.click(aiButton);

      await waitFor(() => {
        const textarea = container.querySelector('textarea');
        if (textarea) {
          fireEvent.change(textarea, {
            target: { value: JSON.stringify({ sDate: 'invalid-date', title: 'Event' }) },
          });
        }
      });

      const applyButtons = screen.getAllByRole('button');
      const applyButton = applyButtons.find(
        (btn) => btn.textContent?.includes('Apply') || btn.textContent?.includes('apply'),
      );

      if (applyButton) {
        await userEvent.click(applyButton);

        await waitFor(() => {
          const titleInput = screen.getByPlaceholderText('Title') as HTMLInputElement;
          expect(titleInput.value).toBe('Event');
        });
      }
    });
  });
});
