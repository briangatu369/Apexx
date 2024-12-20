const InputError = ({ errorMessage }: { errorMessage: string | undefined }) => {
  return (
    <p className="text-bright-red text-[13px] text-sm font-semibold tracking-wide">
      {errorMessage}
    </p>
  );
};

export default InputError;
