
interface DeleteMovieDialogProps {
  movieTitle: string;
  deleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteMovieDialog({
  movieTitle,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteMovieDialogProps) {
  return (
    <div className="dialog-overlay">
      <div
        className="delete-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <h2 id="delete-dialog-title">
          Excluir filme?
        </h2>

        <p id="delete-dialog-description">
          Você está prestes a excluir{" "}
          <strong>{movieTitle}</strong> do catálogo.
          Esta ação não poderá ser desfeita.
        </p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={deleting}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="danger-button"
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting
              ? "Excluindo..."
              : "Sim, excluir filme"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteMovieDialog;
